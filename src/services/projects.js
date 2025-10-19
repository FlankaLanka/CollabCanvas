import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, hasFirebaseConfig } from './firebase';
import { getCurrentUser } from './auth';
import { deleteProjectCanvas } from './canvas';

/**
 * Projects Service - Manages project creation, access, and collaboration
 */

// Collection names
const PROJECTS_COLLECTION = 'projects';

/**
 * Create a new project
 * @param {string} name - Project name
 * @returns {Promise<Object>} Created project data
 */
export async function createProject(name) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping project creation in Firestore');
    return {
      id: `project-${Date.now()}`,
      name,
      ownerId: 'dev-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      memberIds: ['dev-user']
    };
  }

  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to create a project');
    }

    const projectData = {
      name: name.trim(),
      ownerId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      memberIds: [currentUser.uid] // Owner is automatically a member
    };

    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), projectData);
    
    console.log('✅ Project created:', docRef.id);
    return {
      id: docRef.id,
      ...projectData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('❌ Error creating project:', error);
    throw error;
  }
}

/**
 * Get all projects for a user (owned or member of)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of project objects
 */
export async function getUserProjects(userId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Returning empty projects array');
    return [];
  }

  try {
    const projectsRef = collection(db, PROJECTS_COLLECTION);
    const q = query(
      projectsRef,
      where('memberIds', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const projects = [];
    
    querySnapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      });
    });
    
    console.log('📋 Retrieved user projects:', projects.length);
    return projects;
  } catch (error) {
    console.error('❌ Error getting user projects:', error);
    throw error;
  }
}

/**
 * Get a single project by ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object|null>} Project data or null if not found
 */
export async function getProject(projectId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Returning mock project');
    return {
      id: projectId,
      name: 'Mock Project',
      ownerId: 'dev-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      memberIds: ['dev-user']
    };
  }

  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (projectSnap.exists()) {
      const data = projectSnap.data();
      return {
        id: projectSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    } else {
      console.log('❌ Project not found:', projectId);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting project:', error);
    throw error;
  }
}

/**
 * Update project details
 * @param {string} projectId - Project ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateProject(projectId, updates) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping project update');
    return;
  }

  try {
    const currentUser = getCurrentUser();
    const project = await getProject(projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    if (project.ownerId !== currentUser.uid) {
      throw new Error('Only project owner can update project details');
    }

    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Project updated:', projectId);
  } catch (error) {
    console.error('❌ Error updating project:', error);
    throw error;
  }
}

/**
 * Delete a project and all its data
 * @param {string} projectId - Project ID
 * @returns {Promise<void>}
 */
export async function deleteProject(projectId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping project deletion');
    return;
  }

  try {
    const currentUser = getCurrentUser();
    const project = await getProject(projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    if (project.ownerId !== currentUser.uid) {
      throw new Error('Only project owner can delete project');
    }

    // Delete project document
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await deleteDoc(projectRef);
    
    // Delete associated canvas data
    await deleteProjectCanvas(projectId);
    
    console.log('✅ Project deleted:', projectId);
  } catch (error) {
    console.error('❌ Error deleting project:', error);
    throw error;
  }
}

/**
 * Add a user to project members
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID to add
 * @returns {Promise<void>}
 */
export async function addProjectMember(projectId, userId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping member addition');
    return;
  }

  try {
    const currentUser = getCurrentUser();
    const project = await getProject(projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Allow self-addition for invitations, otherwise only owner can add members
    const isSelfAddition = userId === currentUser.uid;
    if (!isSelfAddition && project.ownerId !== currentUser.uid) {
      throw new Error('Only project owner can add members');
    }

    if (project.memberIds.includes(userId)) {
      console.log('User is already a member of this project');
      return;
    }

    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, {
      memberIds: [...project.memberIds, userId],
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Member added to project:', userId);
  } catch (error) {
    console.error('❌ Error adding project member:', error);
    throw error;
  }
}

/**
 * Remove a user from project members
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID to remove
 * @returns {Promise<void>}
 */
export async function removeProjectMember(projectId, userId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping member removal');
    return;
  }

  try {
    const currentUser = getCurrentUser();
    const project = await getProject(projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    if (project.ownerId !== currentUser.uid) {
      throw new Error('Only project owner can remove members');
    }

    if (project.ownerId === userId) {
      throw new Error('Cannot remove project owner');
    }

    const updatedMemberIds = project.memberIds.filter(id => id !== userId);
    
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, {
      memberIds: updatedMemberIds,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Member removed from project:', userId);
  } catch (error) {
    console.error('❌ Error removing project member:', error);
    throw error;
  }
}

/**
 * Check if user has access to project
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user has access
 */
export async function userHasProjectAccess(projectId, userId) {
  try {
    const project = await getProject(projectId);
    if (!project) return false;
    
    return project.ownerId === userId || project.memberIds.includes(userId);
  } catch (error) {
    console.error('❌ Error checking project access:', error);
    return false;
  }
}

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
import { getProject, addProjectMember } from './projects';

/**
 * Invitations Service - Manages project collaboration invitations
 */

// Collection names
const INVITATIONS_COLLECTION = 'project_invitations';

/**
 * Create an invitation for a project
 * @param {string} projectId - Project ID
 * @param {string} invitedEmail - Email of user to invite
 * @returns {Promise<Object>} Created invitation data
 */
export async function createInvitation(projectId, invitedEmail) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping invitation creation');
    return {
      id: `invitation-${Date.now()}`,
      projectId,
      projectName: 'Mock Project',
      invitedByUserId: 'dev-user',
      invitedByName: 'Dev User',
      invitedUserEmail: invitedEmail,
      status: 'pending',
      createdAt: new Date()
    };
  }

  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to create invitations');
    }

    // Get project details
    const project = await getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    if (project.ownerId !== currentUser.uid) {
      throw new Error('Only project owner can send invitations');
    }

    // Check if user is already a member
    if (project.memberIds.includes(invitedEmail)) {
      throw new Error('User is already a member of this project');
    }

    // Check for existing pending invitation
    const existingInvitations = await getProjectInvitations(projectId);
    const existingInvitation = existingInvitations.find(
      inv => inv.invitedUserEmail === invitedEmail && inv.status === 'pending'
    );
    
    if (existingInvitation) {
      throw new Error('Invitation already sent to this email');
    }

    const invitationData = {
      projectId,
      projectName: project.name,
      invitedByUserId: currentUser.uid,
      invitedByName: currentUser.displayName || currentUser.email.split('@')[0],
      invitedUserEmail: invitedEmail.toLowerCase().trim(),
      status: 'pending',
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, INVITATIONS_COLLECTION), invitationData);
    
    console.log('✅ Invitation created:', docRef.id);
    return {
      id: docRef.id,
      ...invitationData,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('❌ Error creating invitation:', error);
    throw error;
  }
}

/**
 * Get invitations for a specific user by email
 * @param {string} userEmail - User email
 * @returns {Promise<Array>} Array of invitation objects
 */
export async function getUserInvitations(userEmail) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Returning empty invitations array');
    return [];
  }

  try {
    const invitationsRef = collection(db, INVITATIONS_COLLECTION);
    const q = query(
      invitationsRef,
      where('invitedUserEmail', '==', userEmail.toLowerCase().trim()),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const invitations = [];
    
    querySnapshot.forEach((doc) => {
      invitations.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      });
    });
    
    console.log('📧 Retrieved user invitations:', invitations.length);
    return invitations;
  } catch (error) {
    console.error('❌ Error getting user invitations:', error);
    throw error;
  }
}

/**
 * Get all invitations for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} Array of invitation objects
 */
export async function getProjectInvitations(projectId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Returning empty project invitations array');
    return [];
  }

  try {
    const invitationsRef = collection(db, INVITATIONS_COLLECTION);
    const q = query(
      invitationsRef,
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const invitations = [];
    
    querySnapshot.forEach((doc) => {
      invitations.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      });
    });
    
    console.log('📋 Retrieved project invitations:', invitations.length);
    return invitations;
  } catch (error) {
    console.error('❌ Error getting project invitations:', error);
    throw error;
  }
}

/**
 * Accept an invitation
 * @param {string} invitationId - Invitation ID
 * @returns {Promise<void>}
 */
export async function acceptInvitation(invitationId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping invitation acceptance');
    return;
  }

  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to accept invitations');
    }

    // Get invitation details
    const invitationRef = doc(db, INVITATIONS_COLLECTION, invitationId);
    const invitationSnap = await getDoc(invitationRef);
    
    if (!invitationSnap.exists()) {
      throw new Error('Invitation not found');
    }

    const invitation = invitationSnap.data();
    
    // Verify this invitation is for the current user
    if (invitation.invitedUserEmail !== currentUser.email) {
      throw new Error('This invitation is not for you');
    }

    if (invitation.status !== 'pending') {
      throw new Error('This invitation has already been responded to');
    }

    // Use batch to update invitation and add user to project
    const batch = writeBatch(db);
    
    // Update invitation status
    batch.update(invitationRef, {
      status: 'accepted',
      respondedAt: serverTimestamp()
    });

    // Add user to project members (allow self-addition for invitations)
    await addProjectMember(invitation.projectId, currentUser.uid, true);
    
    await batch.commit();
    
    console.log('✅ Invitation accepted:', invitationId);
  } catch (error) {
    console.error('❌ Error accepting invitation:', error);
    throw error;
  }
}

/**
 * Decline an invitation
 * @param {string} invitationId - Invitation ID
 * @returns {Promise<void>}
 */
export async function declineInvitation(invitationId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping invitation decline');
    return;
  }

  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to decline invitations');
    }

    // Get invitation details
    const invitationRef = doc(db, INVITATIONS_COLLECTION, invitationId);
    const invitationSnap = await getDoc(invitationRef);
    
    if (!invitationSnap.exists()) {
      throw new Error('Invitation not found');
    }

    const invitation = invitationSnap.data();
    
    // Verify this invitation is for the current user
    if (invitation.invitedUserEmail !== currentUser.email) {
      throw new Error('This invitation is not for you');
    }

    if (invitation.status !== 'pending') {
      throw new Error('This invitation has already been responded to');
    }

    // Update invitation status
    await updateDoc(invitationRef, {
      status: 'declined',
      respondedAt: serverTimestamp()
    });
    
    console.log('✅ Invitation declined:', invitationId);
  } catch (error) {
    console.error('❌ Error declining invitation:', error);
    throw error;
  }
}

/**
 * Cancel an invitation (project owner only)
 * @param {string} invitationId - Invitation ID
 * @returns {Promise<void>}
 */
export async function cancelInvitation(invitationId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping invitation cancellation');
    return;
  }

  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to cancel invitations');
    }

    // Get invitation details
    const invitationRef = doc(db, INVITATIONS_COLLECTION, invitationId);
    const invitationSnap = await getDoc(invitationRef);
    
    if (!invitationSnap.exists()) {
      throw new Error('Invitation not found');
    }

    const invitation = invitationSnap.data();
    
    // Verify current user is the project owner
    const project = await getProject(invitation.projectId);
    if (!project || project.ownerId !== currentUser.uid) {
      throw new Error('Only project owner can cancel invitations');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Cannot cancel invitation that has already been responded to');
    }

    // Delete the invitation
    await deleteDoc(invitationRef);
    
    console.log('✅ Invitation cancelled:', invitationId);
  } catch (error) {
    console.error('❌ Error cancelling invitation:', error);
    throw error;
  }
}

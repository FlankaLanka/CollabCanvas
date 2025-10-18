# AWS AI Agent Deployment Guide

This guide covers deploying the AI agent to AWS using either Lambda (serverless) or EC2 (traditional server).

## 🚀 **Option 1: AWS Lambda + API Gateway (Serverless)**

### Prerequisites
- AWS CLI configured with credentials
- Node.js 18+ installed
- Serverless Framework installed: `npm install -g serverless`

### Deployment Steps

1. **Install dependencies:**
   ```bash
   cd aws-ai-server
   npm install
   ```

2. **Set environment variables:**
   ```bash
   export OPENAI_API_KEY="your-openai-api-key-here"
   export ALLOWED_ORIGINS="https://collab-canvas-virid.vercel.app,http://localhost:5173,http://localhost:3000"
   ```

3. **Deploy to AWS:**
   ```bash
   npx serverless deploy
   ```

4. **Get the API endpoint:**
   After deployment, you'll get an API Gateway URL like:
   ```
   https://abc123.execute-api.us-east-1.amazonaws.com/dev
   ```

5. **Test the deployment:**
   ```bash
   curl https://your-api-gateway-url/health
   ```

### Benefits
- ✅ Serverless (pay per request)
- ✅ Auto-scaling
- ✅ No server management
- ✅ Built-in monitoring

---

## 🖥️ **Option 2: EC2 with Node.js Server**

### Prerequisites
- AWS EC2 instance running Ubuntu/Amazon Linux
- Node.js 18+ installed on EC2
- Domain name (optional, for custom domain)

### Deployment Steps

1. **Connect to your EC2 instance:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Install Node.js (if not already installed):**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone and setup the project:**
   ```bash
   git clone your-repo-url
   cd aws-ai-server
   npm install
   ```

4. **Set environment variables:**
   ```bash
   export OPENAI_API_KEY="your-openai-api-key-here"
   export ALLOWED_ORIGINS="https://collab-canvas-virid.vercel.app,http://localhost:5173,http://localhost:3000"
   export NODE_ENV=production
   export PORT=3000
   ```

5. **Install PM2 for process management:**
   ```bash
   sudo npm install -g pm2
   ```

6. **Start the server:**
   ```bash
   pm2 start server.js --name "ai-agent"
   pm2 save
   pm2 startup
   ```

7. **Configure security groups:**
   - Open port 3000 in your EC2 security group
   - Or use a reverse proxy (nginx) on port 80/443

8. **Test the deployment:**
   ```bash
   curl http://your-ec2-ip:3000/health
   ```

### Benefits
- ✅ Full control over server
- ✅ Custom domain support
- ✅ Persistent storage
- ✅ Lower cost for high traffic

---

## 🔧 **Configuration**

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | Your OpenAI API key |
| `ALLOWED_ORIGINS` | ❌ No | CORS origins (comma-separated) |
| `NODE_ENV` | ❌ No | Environment (production/development) |
| `PORT` | ❌ No | Server port (EC2 only) |

### CORS Configuration

The server automatically allows requests from:
- `https://collab-canvas-virid.vercel.app` (your production app)
- `http://localhost:5173` (local Vite dev server)
- `http://localhost:3000` (local development)

Add more origins by setting `ALLOWED_ORIGINS` environment variable.

---

## 📱 **Frontend Integration**

### Update your frontend to use the AWS endpoint:

```javascript
// In src/services/ai.js
const AI_API_ENDPOINT = 'https://your-aws-api-gateway-url'; // Replace with your actual URL
```

### Example URLs:
- **Lambda**: `https://abc123.execute-api.us-east-1.amazonaws.com/dev`
- **EC2**: `http://your-ec2-ip:3000` or `https://your-domain.com`

---

## 🧪 **Testing**

### Health Check
```bash
curl https://your-aws-endpoint/health
```

### AI Chat Test
```bash
curl -X POST https://your-aws-endpoint/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "create a blue circle"}],
    "functions": [],
    "function_call": "auto",
    "canvasState": {"shapes": [], "totalShapes": 0}
  }'
```

---

## 🔍 **Monitoring**

### Lambda (Serverless)
- CloudWatch Logs: `/aws/lambda/aws-ai-agent-dev-api`
- CloudWatch Metrics: API Gateway and Lambda metrics
- X-Ray tracing (optional)

### EC2 (Traditional)
- PM2 monitoring: `pm2 monit`
- System logs: `/var/log/`
- Application logs: PM2 logs

---

## 🚨 **Troubleshooting**

### Common Issues

1. **CORS errors:**
   - Check `ALLOWED_ORIGINS` environment variable
   - Verify your frontend URL is in the allowed origins

2. **OpenAI API errors:**
   - Verify `OPENAI_API_KEY` is set correctly
   - Check API key has sufficient credits

3. **Lambda timeout:**
   - Increase timeout in `serverless.yml`
   - Optimize your OpenAI requests

4. **EC2 connection issues:**
   - Check security group settings
   - Verify server is running: `pm2 status`

### Debug Commands

```bash
# Check server status (EC2)
pm2 status
pm2 logs ai-agent

# Test API endpoint
curl -v https://your-endpoint/health

# Check environment variables
echo $OPENAI_API_KEY
```

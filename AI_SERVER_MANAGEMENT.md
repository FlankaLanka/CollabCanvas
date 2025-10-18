# AI Server Management Guidelines

## Critical Rule: Always Clean Up Before Starting

**BEFORE starting any new AI server, ALWAYS run this command first:**

```bash
pkill -f "node server.js" && sleep 2
```

## Why This Matters

- Multiple AI servers running simultaneously cause conflicts
- Port 3001 can only be used by one process at a time
- Old servers may have outdated code and cause errors
- Memory leaks and resource conflicts occur with multiple instances

## Standard Server Startup Procedure

1. **Kill existing servers:**
   ```bash
   pkill -f "node server.js" && sleep 2
   ```

2. **Start new server:**
   ```bash
   OPENAI_API_KEY="your-key-here" node server.js
   ```

3. **Verify only one server is running:**
   ```bash
   ps aux | grep "node server.js"
   ```

## Server Management Commands

### Check Running Servers
```bash
ps aux | grep "node server.js"
```

### Kill All AI Servers
```bash
pkill -f "node server.js"
```

### Kill and Restart (Recommended)
```bash
pkill -f "node server.js" && sleep 2 && OPENAI_API_KEY="your-key" node server.js
```

### Check Server Health
```bash
curl -s http://localhost:3001/api/ai-chat -X POST -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"test"}],"temperature":0.2,"canvasState":{"shapes":[],"totalShapes":0}}'
```

## Common Issues

1. **Port already in use**: Kill existing servers first
2. **Outdated code running**: Always restart after code changes
3. **Memory issues**: Multiple servers consume more resources
4. **API conflicts**: Old servers may have different API endpoints

## Best Practices

- Always use the kill-and-restart pattern
- Wait 2 seconds between kill and start commands
- Verify server is running before testing
- Use background processes (`&`) only when necessary
- Monitor server logs for errors

## Emergency Cleanup

If servers are stuck or unresponsive:
```bash
# Kill all Node.js processes (use with caution)
pkill -f "node"

# Or kill by port
lsof -ti:3001 | xargs kill -9
```

---

**Remember: Clean up first, then start fresh!**

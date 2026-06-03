# GitHub Issue/PR Monitoring Setup

**Purpose:** Get instant notifications when issues or PRs are opened on your public GitHub repo

---

## 🔐 Security Overview

This setup uses **GitHub Secrets** to protect sensitive information:
- ✅ API keys encrypted by GitHub
- ✅ Never visible in public repo
- ✅ Only accessible to your workflows
- ✅ Automatically masked in logs

---

## 📋 Setup Steps

### Step 1: Create OpenClaw Webhook Endpoint

In your OpenClaw gateway, create an endpoint to receive GitHub notifications:

```javascript
// Example OpenClaw webhook handler
app.post('/webhook/github', (req, res) => {
  const { source, type, action, title, number, url, actor } = req.body;
  
  // Format notification message
  const emoji = type === 'issue' ? '🐛' : '📝';
  const message = `${emoji} ${action.toUpperCase()}: ${title} #${number}
  
Repo: ${repo}
By: ${actor}
${url}`;
  
  // Send to your preferred channel (Telegram, Signal, etc.)
  sendNotification(message);
  
  res.status(200).send('OK');
});
```

### Step 2: Add GitHub Secrets

1. Go to: `https://github.com/zant0p/tab-keeper/settings/secrets/actions`
2. Click "New repository secret"
3. Add these secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `OPENCLAW_WEBHOOK_URL` | Your OpenClaw webhook URL | `https://your-host.com/webhook/github` |
| `OPENCLAW_API_KEY` | API key for authentication | `your-api-key-here` |

### Step 3: Commit the Workflow

The workflow file is already created at: `.github/workflows/notify-issues.yml`

```bash
git add .github/workflows/notify-issues.yml
git commit -m "Add issue/PR monitoring workflow"
git push origin main
```

### Step 4: Test It

1. Open a test issue on your repo
2. Check that you receive a notification
3. Verify the message format is correct

---

## 🔔 Notification Events

You'll get notified for:

**Issues:**
- ✅ Opened
- ✅ Labeled
- ✅ Assigned
- ✅ Closed

**Pull Requests:**
- ✅ Opened
- ✅ Review requested
- ✅ Closed

---

## 🎨 Customization Options

### Filter by Label

Only notify for certain labels:

```yaml
# Add this step before sending notification
- name: Check if important
  if: contains(github.event.issue.labels.*.name, 'bug') || 
      contains(github.event.issue.labels.*.name, 'urgent')
```

### Different Channels for Different Events

Route critical issues to Telegram, others to email:

```javascript
if (action === 'opened' && labels.includes('critical')) {
  sendToTelegram(message);  // Immediate
} else {
  sendToEmail(message);     // Batched digest
}
```

### Add Rate Limiting

Prevent spam if someone opens many issues:

```javascript
const lastNotification = await getLastNotificationTime();
if (Date.now() - lastNotification < 5000) {
  // Skip if notified within last 5 seconds
  return;
}
```

---

## 📊 Alternative: Direct to Telegram (No OpenClaw)

If you don't want to use OpenClaw as middleman:

### Secrets to Add:
- `TELEGRAM_BOT_TOKEN` - From @BotFather
- `TELEGRAM_CHAT_ID` - Your chat ID

### Workflow:
```yaml
- name: Send to Telegram
  env:
    TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
  run: |
    curl -X POST "https://api.telegram.org/bot$TOKEN/sendMessage" \
      -d "chat_id=$CHAT_ID" \
      -d "text=🚨 New issue: ${{ github.event.issue.title }}"
```

**Pros:** Simpler, no server needed  
**Cons:** Less flexible routing, tied to Telegram

---

## 🔒 Security Best Practices

### ✅ DO:
- Store all tokens in GitHub Secrets
- Use HTTPS for webhook URLs
- Validate API keys on your server
- Rate limit incoming requests
- Log all webhook received

### ❌ DON'T:
- Hardcode URLs or tokens in workflow files
- Expose webhook URLs in public repo
- Accept webhooks without authentication
- Process payloads without validation

---

## 🛠️ Troubleshooting

### Workflow not triggering?
- Check it's on the `main` branch
- Verify the workflow file has correct syntax
- Look at Actions tab for errors

### Notifications not arriving?
- Check OpenClaw logs for incoming requests
- Verify API key is correct
- Test webhook URL with curl:
  ```bash
  curl -X POST https://your-host.com/webhook/github \
    -H "Authorization: Bearer your-api-key" \
    -d '{"test": true}'
  ```

### Getting spam notifications?
- Add filters in workflow (by label, action type)
- Implement rate limiting in OpenClaw handler
- Only notify on specific actions (e.g., just "opened")

---

## 📈 Advanced: Daily Digest

Instead of instant notifications, get a daily summary:

```yaml
name: Daily GitHub Digest

on:
  schedule:
    - cron: '0 9 * * *'  # Every day at 9 AM UTC

jobs:
  digest:
    runs-on: ubuntu-latest
    steps:
      - name: Get issues/PRs from last 24h
        uses: actions/github-script@v6
        with:
          script: |
            // Query GitHub API for last 24h activity
            // Send summary to OpenClaw
```

---

**Setup Time:** ~15 minutes  
**Maintenance:** None (fully automated)  
**Cost:** Free (GitHub Actions free tier)

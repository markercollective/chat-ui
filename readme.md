# chat-ui

A lightweight JavaScript library for integrating a chatbot or other
conversational experience into a website.

Provides chat UI and HTML elements; styling and integration is up to you.

## Backend API

This is only the frontend client; you're expected to provide a backend API for
it to talk to. Your API should accept HTTP POST requests, with a body in the
format:

```json
{
  "messages": [
    {
      "role": "USER",
      "message": "Hi, how are you?"
    },
    {
      "role": "SYSTEM",
      "message": "Good, thanks. You?"
    },
    {
      "role": "USER",
      "message": "Great! Can you give me a good pizza recipe?"
    }
  ]
}
```

Each request will include the entire conversation history so far for continuity.
The last message in the array will be of role `USER`.

Your API should return responses in a single `output` key, which may include some
basic Markdown formatting (lists, links, etc) as needed:

```json
{ "output": "Chat bot output here" }
```

## Usage

```
<script src="https://formation-team.github.io/chat-ui/chat-ui.js"></script>
<script>
const chatbot = new ChatUI({
  // Required
  element: document.querySelector('.chat-ui'),
  apiUrl: 'https://example.com/my/api',

  // Optional
  placeholder: 'Your message placeholder',
  systemName: 'Robot',
  userName: 'You'
});
</script>
```

Creates elements with the following class names:

- `.chatui-messages`
  - `.chatui-message`
    - `.chatui-message-author`
    - `.chatui-message-text`
  - `.chatui-typing-indicator`
  - `.chatui-error`
- `.chatui-input`

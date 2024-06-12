import { marked } from "marked";
import fetchJson from "./fetch-json";

interface Options {
  element: HTMLElement;
  apiUrl: string;

  placeholder?: string;
  systemName?: string;
  userName?: string;
}

interface Message {
  role: 'SYSTEM' | 'USER';
  message: string;
}

function createElement<T extends HTMLElement>(tagName: string, className: string): T {
  const element = document.createElement(tagName) as T;
  element.classList.add(className);
  return element;
}

class ChatUI {
  private containerElement: HTMLElement;
  private apiUrl: string;
  private placeholder: string;
  private systemName: string;
  private userName: string;

  private inputElement: HTMLInputElement = createElement("input", "chatui-input");
  private messagesElement: HTMLDivElement = createElement("div", "chatui-messages");
  private isTyping: boolean = false;
  private error: string | null = null;

  private messages: Message[] = [];

  constructor(options: Options) {
    this.containerElement = options.element;
    this.apiUrl = options.apiUrl;
    this.placeholder = options.placeholder || "Type a message...";
    this.systemName = options.systemName || "System";
    this.userName = options.userName || "You";

    this.render();
  }

  private render() {
    this.messagesElement = createElement<HTMLDivElement>("div", "chatui-messages");

    this.inputElement.placeholder = this.placeholder;
    this.inputElement.type = "text";
    this.inputElement.autofocus = true;

    const formElement = createElement<HTMLFormElement>("form", "chatui-form");
    formElement.appendChild(this.inputElement);
    formElement.addEventListener("submit", this.onSubmit);

    this.containerElement.innerHTML = "";
    this.containerElement.appendChild(this.messagesElement);
    this.containerElement.appendChild(formElement);
  }

  private async renderMessages() {
    if (!this.messagesElement) {
      return;
    }

    this.messagesElement.innerHTML = "";

    for (const message of this.messages) {
      const authorName = message.role === "SYSTEM" ? this.systemName : this.userName;
      const authorElement = createElement("h2", "chatui-message-author");
      authorElement.textContent = authorName;

      const textElement = createElement("p", "chatui-message-text");

      if (message.role === "SYSTEM") {
        const html: string = marked.parse(message.message) as string;
        textElement.innerHTML = html;
      } else {
        textElement.textContent = message.message;
      }

      const messageElement = createElement("div", "chatui-message");

      messageElement.appendChild(authorElement);
      messageElement.appendChild(textElement);

      this.messagesElement.appendChild(messageElement);
    }

    if (this.isTyping) {
      const typingElement = createElement("div", "chatui-typing-indicator");
      typingElement.textContent = "...";
      this.messagesElement.appendChild(typingElement);
    }

    if (this.error) {
      const errorElement = createElement("div", "chatui-error");
      errorElement.textContent = this.error;
      this.messagesElement.appendChild(errorElement);
    }
  }

  private addMessage(message: Message) {
    this.messages.push(message);
    this.renderMessages();
  }

  private onSubmit = async (event: SubmitEvent) => {
    event.preventDefault();

    const message = this.inputElement?.value.trim();

    if (!message) {
      return;
    }

    this.isTyping = true;
    this.addMessage({ role: "USER", message });

    this.inputElement!.value = "";
    this.inputElement!.focus();

    try {
      this.renderMessages();

      const response = await fetchJson<{ output: string }>({
        url: this.apiUrl,
        method: "POST",
        body: {
          messages: this.messages,
        }
      });

      if (!response.output) {
        throw new Error("Response missing output");
      }

      this.isTyping = false;
      this.addMessage({ role: "SYSTEM", message: response.output });
    } catch (error) {
      this.isTyping = false;
      console.error(error);

      this.error = "Failed to send message. Please try again.";
      this.renderMessages();
    }
  }
}

(window as any).ChatUI = ChatUI;

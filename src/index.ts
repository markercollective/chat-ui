import { marked } from "marked";
import fetchJson from "./fetch-json";

interface Options {
  element: HTMLElement;
  apiUrl: string;

  placeholder?: string;
  followUpPlaceholder?: string;
  systemName?: string;
  userName?: string;
}

interface Message {
  role: "SYSTEM" | "USER";
  message: string;
}

function createElement<T extends HTMLElement>(
  tagName: string,
  classNames: string[],
): T {
  const element = document.createElement(tagName) as T;
  element.classList.add(...classNames);
  return element;
}

class ChatUI {
  private containerElement: HTMLElement;
  private apiUrl: string;
  private placeholder: string;
  private followUpPlaceholder: string;
  private systemName: string;
  private userName: string;

  private inputElement: HTMLTextAreaElement = createElement(
    "textarea",
    ["chatui-input"],
  );
  private messagesElement: HTMLDivElement = createElement(
    "div",
    ["chatui-messages"],
  );
  private isTyping: boolean = false;
  private error: string | null = null;

  private messages: Message[] = [];

  constructor(options: Options) {
    this.containerElement = options.element;
    this.apiUrl = options.apiUrl;
    this.placeholder = options.placeholder || "Type a message...";
    this.followUpPlaceholder = options.followUpPlaceholder ||
      options.placeholder || "Type a follow up...";
    this.systemName = options.systemName || "System";
    this.userName = options.userName || "You";

    this.render();
  }

  private render() {
    this.messagesElement = createElement<HTMLDivElement>(
      "div",
      ["chatui-messages"],
    );

    this.inputElement.autofocus = true;
    this.inputElement.rows = 1;
    this.inputElement.addEventListener("input", this.ensureInputSize);
    this.inputElement.addEventListener("keydown", this.onInputKeyDown);

    // deno-lint-ignore no-explicit-any
    (window as any).addEventListener("resize", this.ensureInputSize);

    const formElement = createElement<HTMLFormElement>("form", ["chatui-form"]);
    formElement.appendChild(this.inputElement);
    formElement.addEventListener("submit", this.onSubmit);

    this.containerElement.innerHTML = "";
    this.containerElement.appendChild(this.messagesElement);
    this.containerElement.appendChild(formElement);

    this.renderMessages();
  }

  private createMessageElement = (
    message: Message,
    additionalTextClassName?: string,
  ) => {
    const authorName = message.role === "SYSTEM"
      ? this.systemName
      : this.userName;

    const authorElement = createElement("h2", ["chatui-message-author"]);
    authorElement.textContent = authorName;

    const textElementClassNames = ["chatui-message-text"];

    if (additionalTextClassName) {
      textElementClassNames.push(additionalTextClassName);
    }

    const textElement = createElement("p", textElementClassNames);

    if (message.role === "SYSTEM") {
      const html: string = marked.parse(message.message) as string;
      textElement.innerHTML = html;
    } else {
      textElement.textContent = message.message;
    }

    const messageElement = createElement("div", ["chatui-message"]);

    messageElement.appendChild(authorElement);
    messageElement.appendChild(textElement);
    return messageElement;
  };

  private renderMessages() {
    if (!this.messagesElement || !this.inputElement) {
      return;
    }

    this.messagesElement.innerHTML = "";

    for (const message of this.messages) {
      const messageElement = this.createMessageElement(message);
      this.messagesElement.appendChild(messageElement);
    }

    if (this.isTyping) {
      const messageElement = this.createMessageElement({
        role: "SYSTEM",
        message: "...",
      }, "chatui-typing-indicator");

      this.messagesElement.appendChild(messageElement);
    }

    if (this.error) {
      const errorElement = createElement("div", ["chatui-error"]);
      errorElement.textContent = this.error;
      this.messagesElement.appendChild(errorElement);
    }

    const isFirstMessage = this.messages.length === 0;

    this.containerElement.classList.toggle(
      "chatui-first-message",
      isFirstMessage,
    );

    this.inputElement.placeholder = isFirstMessage
      ? this.placeholder
      : this.followUpPlaceholder;

    this.ensureInputSize();
  }

  private addMessage(message: Message) {
    this.messages.push(message);
    this.renderMessages();
    this.containerElement.scrollTop = this.containerElement.scrollHeight;
    this.inputElement.focus();
  }

  private onSubmit = async (event?: SubmitEvent) => {
    event?.preventDefault();

    const message = this.inputElement?.value.trim();

    if (!message) {
      return;
    }

    this.inputElement!.value = "";
    this.ensureInputSize();
    await this.sendMessage(message);
  };

  private ensureInputSize = () => {
    this.inputElement.style.height = "auto";
    const height = this.inputElement.scrollHeight;
    this.inputElement.style.height = `${height}px`;
  };

  private onInputKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  };

  public sendMessage = async (message: string) => {
    this.isTyping = true;
    this.addMessage({ role: "USER", message });

    try {
      const response = await fetchJson<{ output: string }>({
        url: this.apiUrl,
        method: "POST",
        body: {
          messages: this.messages,
        },
      });

      if (!response.output) {
        throw new Error("Response missing output");
      }

      this.isTyping = false;
      this.error = null;
      this.addMessage({ role: "SYSTEM", message: response.output });
    } catch (error) {
      this.isTyping = false;
      console.error(error);

      this.error = "Failed to send message. Please try again.";
      this.renderMessages();
    }
  };
}

// deno-lint-ignore no-explicit-any
(window as any).ChatUI = ChatUI;

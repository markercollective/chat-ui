interface Options {
  element: HTMLElement;
  apiUrl: string;

  placeholder?: string;
  systemName?: string;
}

class ChatUI {
  private element: HTMLElement;
  private apiUrl: string;
  private placeholder: string;
  private systemName: string;

  constructor(options: Options) {
    this.element = options.element;
    this.apiUrl = options.apiUrl;
    this.placeholder = options.placeholder || "Type a message...";
    this.systemName = options.systemName || "System";

    this.render();
  }

  private render() {
    this.element.innerHTML = `
      <h1>Rendererd</h1>
    `;
  }
}

(window as any).ChatUI = ChatUI;

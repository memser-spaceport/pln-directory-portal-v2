import { Quill } from 'react-quill';

const Inline = Quill.import('blots/inline') as any;

export interface MentionData {
  uid: string;
  name: string;
}

class MentionBlot extends Inline {
  static blotName = 'mention';
  static tagName = 'a';
  static className = 'ql-mention';

  static create(data: MentionData): HTMLElement {
    const node = super.create() as HTMLAnchorElement;
    node.setAttribute('href', `/members/${data.uid}`);
    node.setAttribute('data-uid', data.uid);
    node.setAttribute('data-name', data.name);
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
    node.textContent = `@${data.name}`;
    return node;
  }

  static formats(node: HTMLElement): MentionData | undefined {
    const uid = node.getAttribute('data-uid');
    const name = node.getAttribute('data-name');

    if (uid && name) {
      return { uid, name };
    }
    return undefined;
  }

  static value(node: HTMLElement): MentionData {
    return {
      uid: node.getAttribute('data-uid') || '',
      name: node.getAttribute('data-name') || '',
    };
  }

  format(name: string, value: any): void {
    if (name === 'mention' && value) {
      this.domNode.setAttribute('data-uid', value.uid);
      this.domNode.setAttribute('data-name', value.name);
      this.domNode.setAttribute('href', `/members/${value.uid}`);
    } else {
      super.format(name, value);
    }
  }
}

export function registerMentionBlot(): void {
  Quill.register(MentionBlot, true);
}

export default MentionBlot;

import { Quill } from 'react-quill';

const Embed = Quill.import('blots/embed') as any;

export interface MentionData {
  uid: string;
  name: string;
}

class MentionBlot extends Embed {
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
    node.setAttribute('contenteditable', 'false');
    node.textContent = `@${data.name}`;
    return node;
  }

  static value(node: HTMLElement): MentionData {
    return {
      uid: node.getAttribute('data-uid') || '',
      name: node.getAttribute('data-name') || '',
    };
  }
}

export function registerMentionBlot(): void {
  Quill.register(MentionBlot, true);
}

export default MentionBlot;

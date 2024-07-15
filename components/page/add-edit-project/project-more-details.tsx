import { MdEditor } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';
import { useState } from 'react';

export function ProjectMoreDetails(props: any) {
  const readMe = props?.readMe;

  const [readMeContent, setReadMeContent] = useState(readMe);

  return (
    <div>
      <MdEditor
        modelValue={readMeContent}
        onChange={(content) => {
          setReadMeContent(content);
        }}
        language={'en-US'}
        toolbarsExclude={['catalog', 'github', 'save', 'htmlPreview']}
      />
      <textarea hidden value={readMeContent} defaultValue={readMeContent} name={`readMe`} />
      <div></div>
    </div>
  );
}

import HiddenField from "@/components/form/hidden-field";
import { MdEditor } from "md-editor-rt"
import { useEffect, useState } from "react"
import 'md-editor-rt/lib/style.css';




export function ProjectMoreDetails(props: any) {
    const readMe = props?.readMe

    const [readMeContent, setReadMeContent] = useState(readMe);


    console.log('readd me i', readMe)

    return (
        <div>
              <MdEditor modelValue={readMe} onChange={(content) => { setReadMeContent(content)}} language={'en-US'} toolbarsExclude={['catalog', 'github', 'save', 'htmlPreview']} />
              <HiddenField value={readMeContent} defaultValue={readMeContent} name={`readMe`} />

        </div>
    )
}
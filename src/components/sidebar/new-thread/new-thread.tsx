import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

import { useParams, useNavigate } from "react-router-dom"
import {v4 as uuidv4} from 'uuid';


export function NewThread() {
    const params = useParams()
    const navigate = useNavigate()
    const randomUUID = uuidv4()
    const onClick = () => {
        navigate(`/workspace/${params.workspaceId}/thread/${randomUUID}`)
    }
  return (
    <Button onClick={onClick} className="w-full gap-2 text-xs h-9">
      <Plus className="h-3.5 w-3.5" />
      New Thread
    </Button>
  )
}

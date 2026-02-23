import ProfileProjectList from './ProfileProjectList'
import { Project } from '@/types'

interface ProjectListViewProps {
    projects: Project[]
}

export default function ProjectListView({ projects }: ProjectListViewProps) {
    if (!projects || projects.length === 0) {
        return (
            <div className="text-center text-zinc-600 py-20 font-light">
                No published projects yet.
            </div>
        )
    }

    return <ProfileProjectList projects={projects} />
}

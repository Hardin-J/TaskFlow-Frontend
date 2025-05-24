import axiosInstance from "@/utils/axiosInstance"

const PROJ_URL = 'workspaces'

// get all project in workspace for logged user
export async function getWorkspaceProjects(wrkId: string): Promise<any> {
    try {
        const response = await axiosInstance.get<any>(`${PROJ_URL}/${wrkId}/projects`);
        return response;

    } catch (error: any) {
        console.log('Error in getWorkspaceProjects:', error);
        console.log('URL attempted:', `${PROJ_URL}/${wrkId}/projects`);
        
        // Log response details if available
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
            console.log('Headers:', error.response.headers);
        } else if (error.request) {
            console.log('Request made but no response received:', error.request);
        } else {
            console.log('Error message:', error.message);
        }
        
        const message = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Fetching Projects failed';
        throw new Error(message);
    }
}

// Add new project
export async function createProject(workspaceId: string, project: any): Promise<any> {
    try {
        console.log('Creating project with data:', project);
        console.log('URL:', `${PROJ_URL}/${workspaceId}/projects`);
        
        const response = await axiosInstance.post<any>(`${PROJ_URL}/${workspaceId}/projects`, project);
        return response;

    } catch (error: any) {
        console.log('Error in createProject:', error);
        console.log('URL attempted:', `${PROJ_URL}/${workspaceId}/projects`);
        
        // Log response details if available
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
            console.log('Headers:', error.response.headers);
        } else if (error.request) {
            console.log('Request made but no response received:', error.request);
        } else {
            console.log('Error message:', error.message);
        }
        
        const message = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Adding Project failed';
        throw new Error(message);
    }
}
// Update the workspace
export async function updateProject(wId:string,pId:string,project:any): Promise<any> {
    try {
        const response = await axiosInstance.patch<any>(`${PROJ_URL}/${wId}/projects/${pId}`,project);
        return response;

    } catch (error: any) {
        console.log(error);        
        const message = error.response?.data?.message || 'Editing Workspace failed';
        throw new Error(message);
    }
}

// Get the Project by it's Id
export async function getProjectById(wId:string, pId:string): Promise<any> {
    try {
        const response = await axiosInstance.get<any>(`${PROJ_URL}/${wId}/projects/${pId}`);
        return response;

    } catch (error: any) {
        console.log(error);        
        const message = error.response?.data?.message || 'Getting Projects by Id is failed';
        throw new Error(message);
    }
}

// add people to project 
export async function addProjectMembers(wId:string, pId:string, userIds:any ): Promise<any> {
    try {
        const response = await axiosInstance.post<any>(`${PROJ_URL}/${wId}/projects/${pId}/members`,
            { userIds }
        );
        return response;

    } catch (error: any) {
        console.log(error);        
        const message = error.response?.data?.message || 'Adding user to project is failed';
        throw new Error(message);
    }
}

// delete Project
export async function deleteProject(wId:string,pId:string): Promise<any> {
    try {
        const response = await axiosInstance.delete<any>(`${PROJ_URL}/${wId}/projects/${pId}`);
        return response;

    } catch (error: any) {
        console.log(error);        
        const message = error.response?.data?.message || 'Deleting Workspace by Id is failed';
        throw new Error(message);
    }
}

// get all members of projects
// export async function getProjectMembers(wId:string, pId:string): Promise<any> {
//     try {
//         const response = await axiosInstance.get<any>(`${PROJ_URL}/${wId}/projects/${pId}/members`);
//         return response;

//     } catch (error: any) {
//         console.log(error);        
//         const message = error.response?.data?.message || 'Getting project members is failed';
//         throw new Error(message);
//     }
// }

export async function getProjectMembers(workspaceId: string, projectId: string): Promise<any> {
    try {
        console.log('Fetching project members from:', `${PROJ_URL}/${workspaceId}/projects/${projectId}/members`);
        const response = await axiosInstance.get<any>(`${PROJ_URL}/${workspaceId}/projects/${projectId}/members`);
        console.log('Project members response:', response.data);
        return response;

    } catch (error: any) {
        console.log('Error in getProjectMembers:', error);
        console.log('URL attempted:', `${PROJ_URL}/${workspaceId}/projects/${projectId}/members`);
        
        // Log response details if available
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
            console.log('Headers:', error.response.headers);
        } else if (error.request) {
            console.log('Request made but no response received:', error.request);
        } else {
            console.log('Error message:', error.message);
        }
        
        const message = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Fetching project members failed';
        throw new Error(message);
    }
}
export async function getUserWorkspaces(): Promise<any> {
    try {
        console.log('Fetching user workspaces');
        const response = await axiosInstance.get<any>('workspaces');
        console.log('Workspaces fetched successfully:', response.data);
        return response;

    } catch (error: any) {
        console.log('Error in getUserWorkspaces:', error);
        
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
        
        const message = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Fetching Workspaces failed';
        throw new Error(message);
    }
}

// remove the member from the existing project
export async function removeProjectMember(wId:string, pId:string, usrId:string): Promise<any> {
    try {
        const response = await axiosInstance.delete<any>(`${PROJ_URL}/${wId}/projects/${pId}/members/${usrId}`);
        return response;

    } catch (error: any) {
        console.log(error);        
        const message = error.response?.data?.message || 'Removing project member is failed';
        throw new Error(message);
    }
}

// upload a single file for Project
export async function uploadProjectFile(wId:string, pId:string,file:any): Promise<any> {
    try {
        const response = await axiosInstance.post<any>(`${PROJ_URL}/${wId}/projects/${pId}/files`,file);
        return response;

    } catch (error: any) {
        console.log(error);        
        const message = error.response?.data?.message || 'Adding file to project is failed';
        throw new Error(message);
    }
}

// listing all files in the Project
export async function listProjectFiles(wId:string, pId:string): Promise<any> {
    try {
        const response = await axiosInstance.get<any>(`${PROJ_URL}/${wId}/projects/${pId}/files`);
        return response;

    } catch (error: any) {
        console.log(error);        
        const message = error.response?.data?.message || 'Listing all files for Project is failed';
        throw new Error(message);
    }
}

// getting a single file in from the Project
export async function getProjectFile(wId:string, pId:string, filePath:string): Promise<any> {
    try {
        const response = await axiosInstance.get<any>(`${PROJ_URL}/${wId}/projects/${pId}/files/${filePath}`);
        return response;

    } catch (error: any) {
        console.log(error);        
        const message = error.response?.data?.message || 'Getting single file by file Id is failed';
        throw new Error(message);
    }
}

// delete a single file from the Project
export async function deleteProjectFile(wId:string, pId:string, filePath:string): Promise<any> {
    try {
        const response = await axiosInstance.delete<any>(`${PROJ_URL}/${wId}/projects/${pId}/files/${filePath}`);
        return response;

    } catch (error: any) {
        console.log(error);        
        const message = error.response?.data?.message || 'Deleting file in project by file Id is failed';
        throw new Error(message);
    }
}


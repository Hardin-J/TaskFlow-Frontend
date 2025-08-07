import axiosInstance from "@/utils/axiosInstance"

const workspaceAPI = 'workspaces'

export async function getAllWorkspaces(): Promise<any> {
    try {
        console.log('Fetching workspaces from:', workspaceAPI);
        const response = await axiosInstance.get<any>(`${workspaceAPI}`);
        console.log('Workspace response:', response.data);
        return response;

    } catch (error: any) {
        console.log('Error in getAllWorkspaces:', error);
        console.log('URL attempted:', workspaceAPI);
        
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
                       'Fetching Workspace failed';
        throw new Error(message);
    }
}

export async function addNewWorkspaces(workspace:any): Promise<any> {
    try {
        const response = await axiosInstance.post<any>(`${workspaceAPI}/`,workspace);
        return response;

    } catch (error: any) {
        console.log(error);        
        const message = error.response?.data?.message || 'Adding Workspace failed';
        throw new Error(message);
    }
}

export async function editWorkspaces(id:string,workspace:any): Promise<any> {
    try {
        const response = await axiosInstance.patch<any>(`${workspaceAPI}/${id}`,workspace);
        return response;

    } catch (error: any) {
        console.log(error);        
        const message = error.response?.data?.message || 'Editing Workspace failed';
        throw new Error(message);
    }
}

// NEW: Get single workspace by ID
export async function getWorkspaceById(id: string): Promise<any> {
    try {
        const response = await axiosInstance.get<any>(`${workspaceAPI}/${id}`);
        return response;

    } catch (error: any) {
        console.log(error);        
        const message = error.response?.data?.message || 'Fetching Workspace failed';
        throw new Error(message);
    }
}

// NEW: Delete workspace
export async function deleteWorkspace(id: string): Promise<any> {
    try {
        const response = await axiosInstance.delete<any>(`${workspaceAPI}/${id}`);
        return response;

    } catch (error: any) {
        console.log(error);        
        const message = error.response?.data?.message || 'Deleting Workspace failed';
        throw new Error(message);
    }
}
import axiosInstance from "@/utils/axiosInstance"

const workspaceAPI = 'workspaces'

export async function getAllWorkspaces(): Promise<any> {
    try {
        const response = await axiosInstance.get<any>(`${workspaceAPI}/`);
        return response;

    } catch (error: any) {
        console.log(error);        
        const message = error.response?.data?.message || 'Fetching Workspace failed';
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

        
import axiosInstance from "@/utils/axiosInstance"

const TASK_URL = 'workspaces'

// Create new task
export async function createTask(workspaceId: string, projectId: string, task: any): Promise<any> {
    try {
        console.log('Creating task with data:', task);
        console.log('URL:', `${TASK_URL}/${workspaceId}/projects/${projectId}/tasks`);
        
        const response = await axiosInstance.post<any>(`${TASK_URL}/${workspaceId}/projects/${projectId}/tasks`, task);
        return response;

    } catch (error: any) {
        console.log('Error in createTask:', error);
        console.log('URL attempted:', `${TASK_URL}/${workspaceId}/projects/${projectId}/tasks`);
        
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
                       'Creating task failed';
        throw new Error(message);
    }
}

// Get all tasks in a project
export async function getProjectTasks(workspaceId: string, projectId: string, params?: {
    status?: string;
    assignee?: string;
    search?: string;
}): Promise<any> {
    try {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.assignee) queryParams.append('assignee', params.assignee);
        if (params?.search) queryParams.append('search', params.search);
        
        const url = `${TASK_URL}/${workspaceId}/projects/${projectId}/tasks${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await axiosInstance.get<any>(url);
        return response;

    } catch (error: any) {
        console.log('Error in getProjectTasks:', error);
        
        const message = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Fetching tasks failed';
        throw new Error(message);
    }
}

// Get single task by ID
export async function getTask(workspaceId: string, projectId: string, taskId: string): Promise<any> {
    try {
        const response = await axiosInstance.get<any>(`${TASK_URL}/${workspaceId}/projects/${projectId}/tasks/${taskId}`);
        return response;

    } catch (error: any) {
        console.log('Error in getTask:', error);
        
        const message = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Getting task failed';
        throw new Error(message);
    }
}

// Update task
export async function updateTask(workspaceId: string, projectId: string, taskId: string, updates: any): Promise<any> {
    try {
        const response = await axiosInstance.patch<any>(`${TASK_URL}/${workspaceId}/projects/${projectId}/tasks/${taskId}`, updates);
        return response;

    } catch (error: any) {
        console.log('Error in updateTask:', error);
        
        const message = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Updating task failed';
        throw new Error(message);
    }
}

// Delete task
export async function deleteTask(workspaceId: string, projectId: string, taskId: string): Promise<any> {
    try {
        const response = await axiosInstance.delete<any>(`${TASK_URL}/${workspaceId}/projects/${projectId}/tasks/${taskId}`);
        return response;

    } catch (error: any) {
        console.log('Error in deleteTask:', error);
        
        const message = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Deleting task failed';
        throw new Error(message);
    }
}

// Add task follower
export async function addTaskFollower(workspaceId: string, projectId: string, taskId: string, userId: string): Promise<any> {
    try {
        const response = await axiosInstance.post<any>(`${TASK_URL}/${workspaceId}/projects/${projectId}/tasks/${taskId}/followers`, {
            userId
        });
        return response;

    } catch (error: any) {
        console.log('Error in addTaskFollower:', error);
        
        const message = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Adding task follower failed';
        throw new Error(message);
    }
}

// Create subtask
export async function createSubtask(workspaceId: string, projectId: string, taskId: string, subtask: any): Promise<any> {
    try {
        const response = await axiosInstance.post<any>(`${TASK_URL}/${workspaceId}/projects/${projectId}/tasks/${taskId}/subtasks`, subtask);
        return response;

    } catch (error: any) {
        console.log('Error in createSubtask:', error);
        
        const message = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Creating subtask failed';
        throw new Error(message);
    }
}

// Get subtasks
export async function getSubtasks(workspaceId: string, projectId: string, taskId: string): Promise<any> {
    try {
        const response = await axiosInstance.get<any>(`${TASK_URL}/${workspaceId}/projects/${projectId}/tasks/${taskId}/subtasks`);
        return response;

    } catch (error: any) {
        console.log('Error in getSubtasks:', error);
        
        const message = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Getting subtasks failed';
        throw new Error(message);
    }
}

// Update subtask
export async function updateSubtask(workspaceId: string, projectId: string, taskId: string, subtaskId: string, updates: any): Promise<any> {
    try {
        const response = await axiosInstance.patch<any>(`${TASK_URL}/${workspaceId}/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`, updates);
        return response;

    } catch (error: any) {
        console.log('Error in updateSubtask:', error);
        
        const message = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Updating subtask failed';
        throw new Error(message);
    }
}

// Delete subtask
export async function deleteSubtask(workspaceId: string, projectId: string, taskId: string, subtaskId: string): Promise<any> {
    try {
        const response = await axiosInstance.delete<any>(`${TASK_URL}/${workspaceId}/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`);
        return response;

    } catch (error: any) {
        console.log('Error in deleteSubtask:', error);
        
        const message = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Deleting subtask failed';
        throw new Error(message);
    }
}

// Upload task file
export async function uploadTaskFile(workspaceId: string, projectId: string, taskId: string, file: any): Promise<any> {
    try {
        const response = await axiosInstance.post<any>(`${TASK_URL}/${workspaceId}/projects/${projectId}/tasks/${taskId}/files`, file);
        return response;

    } catch (error: any) {
        console.log('Error in uploadTaskFile:', error);
        
        const message = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Uploading task file failed';
        throw new Error(message);
    }
}

// List task files
export async function listTaskFiles(workspaceId: string, projectId: string, taskId: string): Promise<any> {
    try {
        const response = await axiosInstance.get<any>(`${TASK_URL}/${workspaceId}/projects/${projectId}/tasks/${taskId}/files`);
        return response;

    } catch (error: any) {
        console.log('Error in listTaskFiles:', error);
        
        const message = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Listing task files failed';
        throw new Error(message);
    }
}

// Get task file
export async function getTaskFile(workspaceId: string, projectId: string, taskId: string, filePath: string): Promise<any> {
    try {
        const response = await axiosInstance.get<any>(`${TASK_URL}/${workspaceId}/projects/${projectId}/tasks/${taskId}/files/${filePath}`);
        return response;

    } catch (error: any) {
        console.log('Error in getTaskFile:', error);
        
        const message = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Getting task file failed';
        throw new Error(message);
    }
}

// Delete task file
export async function deleteTaskFile(workspaceId: string, projectId: string, taskId: string, filePath: string): Promise<any> {
    try {
        const response = await axiosInstance.delete<any>(`${TASK_URL}/${workspaceId}/projects/${projectId}/tasks/${taskId}/files/${filePath}`);
        return response;

    } catch (error: any) {
        console.log('Error in deleteTaskFile:', error);
        
        const message = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Deleting task file failed';
        throw new Error(message);
    }
}

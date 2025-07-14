import mongoose from 'mongoose';
import projectModel from '../models/project.model.js';



export const createProject = async ({
    name, userId
}) => {
    if(!name || !userId) {
        throw new Error('Project name and user ID are required');
    }

    try {
        const project = await projectModel.create({
            name,
            users: [userId]
        });
        return project;
    } catch (error) {
        throw new Error(`Error creating project: ${error.message}`);
    }
}

export const getAllProjectByUserId = async ({ userId }) => {
    if (!userId) {
        throw new Error('User ID is required');
    }

    const allUserProjects = await projectModel.find({
        users: userId
    })

    return allUserProjects;
}

export const addUserToProject = async ({ projectId, users, userId }) => {
    if (!projectId) {
        throw new Error('Project ID is required');
    }

    if(!users) {
        throw new Error('Users are required');
    }

    if(!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid project ID');
    }

    if (!Array.isArray(users) || users.some(userId => !mongoose.Types.ObjectId.isValid(userId))) {
        throw new Error('Users must be an array of valid user IDs');
    }

    if (!userId) {
        throw new Error('User ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
    }

    const project = await projectModel.findOne({
        _id: projectId,
        users: userId
    })

    console.log(project)

    if (!project) {
        throw new Error('Project not found or user is not a member of the project');
    }

    const updatedProject = await projectModel.findByIdAndUpdate({
        _id: projectId
    }, {
        $addToSet: {
            users: {
                $each: users
            }
        }
    }, {
        new: true,
    })

    return updatedProject
   
}

export const getProjectById = async (projectId) => {
    if (!projectId) {
        throw new Error('Project ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        console.log('Invalid project ID:', projectId);
        throw new Error('Invalid project ID');
    }

    const project = await projectModel.findOne({
        _id: projectId
    }).populate('users');

    return project;
}

export const updateFileTree = async (projectId, fileTree) => {
    if (!projectId) {
        throw new Error('Project ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid project ID');
    }

    if (!fileTree) {
        throw new Error('File tree is required');
    }

    const project = await projectModel.findOneAndUpdate({
        _id: projectId
    }, {
        fileTree
    }, {
        new: true
    })

    return project;
}
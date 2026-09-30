"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksController = void 0;
const supabase_1 = require("../../config/supabase");
class TasksController {
    async getTasks(req, res) {
        try {
            const { data: tasks, error } = await supabase_1.supabaseAdmin
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });
            if (!error && tasks && tasks.length > 0) {
                res.status(200).json({ success: true, data: tasks });
                return;
            }
        }
        catch (e) {
            console.log('Supabase tasks note: using mock data');
        }
        res.status(200).json({
            success: true,
            data: [
                {
                    id: 'tsk-1',
                    title: 'Client Review & Feedback',
                    category: 'Landing page redesign',
                    timeRange: 'Today 10:00 PM - 11:45 PM',
                    completed: true,
                },
                {
                    id: 'tsk-2',
                    title: 'Textile Production Audit',
                    category: 'Control de Calidad L&M',
                    timeRange: 'Tomorrow 09:00 AM - 11:00 AM',
                    completed: false,
                },
            ],
        });
    }
    async createTask(req, res) {
        const { title, category, timeRange } = req.body;
        if (!title || !category) {
            res.status(400).json({ success: false, error: 'Título y categoría son obligatorios.' });
            return;
        }
        try {
            const { data: newTask, error } = await supabase_1.supabaseAdmin
                .from('tasks')
                .insert([{ title, category, time_range: timeRange || 'Hoy', user_id: req.user?.id }])
                .select()
                .single();
            if (!error && newTask) {
                res.status(201).json({ success: true, data: newTask });
                return;
            }
        }
        catch (e) {
            console.log('Supabase task creation fallback');
        }
        res.status(201).json({
            success: true,
            data: {
                id: `tsk-${Date.now()}`,
                title,
                category,
                timeRange: timeRange || 'Hoy',
                completed: false,
            },
        });
    }
}
exports.TasksController = TasksController;

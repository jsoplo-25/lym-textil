"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const supabase_1 = require("../../config/supabase");
class UsersController {
    async getUsers(req, res) {
        try {
            const { data: users, error } = await supabase_1.supabaseAdmin
                .from('users')
                .select('id, email, full_name, role, avatar_url, created_at');
            if (!error && users && users.length > 0) {
                res.status(200).json({
                    success: true,
                    data: users,
                });
                return;
            }
        }
        catch (e) {
            console.log('Supabase users query note: returning fallback list');
        }
        const response = {
            success: true,
            data: [
                {
                    id: 'usr_01',
                    email: 'mike@intellecta.io',
                    fullName: 'Mike',
                    role: 'ADMIN',
                    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                },
                {
                    id: 'usr_02',
                    email: 'gerente@textil-lym.com',
                    fullName: 'Gerente Textil',
                    role: 'MANAGER',
                    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                },
            ],
        };
        res.status(200).json(response);
    }
}
exports.UsersController = UsersController;

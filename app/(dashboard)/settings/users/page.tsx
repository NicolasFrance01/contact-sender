"use client";

import { useState, useEffect } from "react";
import { Plus, User, Mail, Shield, Trash2, Edit2, Check, X, Loader2, UserPlus } from "lucide-react";
import { getRoleLabel } from "@/lib/utils";

interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: string;
}

export default function UsersManagementPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Form states
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("EDITOR");
    const [active, setActive] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            if (res.ok) setUsers(data);
        } catch (err) {
            console.error("Fetch users error:", err);
        } finally {
            setLoading(false);
        }
    }

    function openCreateModal() {
        setEditingUser(null);
        setName("");
        setEmail("");
        setPassword("");
        setRole("EDITOR");
        setActive(true);
        setError("");
        setModalOpen(true);
    }

    function openEditModal(user: UserData) {
        setEditingUser(user);
        setName(user.name);
        setEmail(user.email);
        setPassword("");
        setRole(user.role);
        setActive(user.active);
        setError("");
        setModalOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError("");
        const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
        const method = editingUser ? "PUT" : "POST";
        const body: any = { name, email, role, active };
        if (password || !editingUser) body.password = password;

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok) {
                setModalOpen(false);
                fetchUsers();
            } else {
                setError(data.error || "Error al guardar usuario");
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("¿Eliminar este usuario definitivamente?")) return;
        try {
            const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
            if (res.ok) fetchUsers();
            else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (err) {
            alert("Error al eliminar");
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-gold" style={{ color: "var(--color-gold)" }} />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light mb-1" style={{ fontFamily: "var(--font-cormorant)" }}>
                        Gestión de Usuarios
                    </h1>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                        Administrá el acceso y roles del personal
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                        background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))",
                        color: "#000",
                        boxShadow: "0 4px 20px rgba(198,167,94,0.25)",
                    }}
                >
                    <UserPlus className="w-4 h-4" />
                    Nuevo Usuario
                </button>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                            <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground" style={{ color: "var(--color-text-muted)" }}>Nombre</th>
                            <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground" style={{ color: "var(--color-text-muted)" }}>Email</th>
                            <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground" style={{ color: "var(--color-text-muted)" }}>Rol</th>
                            <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground" style={{ color: "var(--color-text-muted)" }}>Estado</th>
                            <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-widest text-muted-foreground" style={{ color: "var(--color-text-muted)" }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-surface-3 transition-colors">
                                <td className="px-5 py-4 font-medium">{user.name}</td>
                                <td className="px-5 py-4 text-muted-foreground" style={{ color: "var(--color-text-muted)" }}>{user.email}</td>
                                <td className="px-5 py-4">
                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                                        style={{
                                            background: "var(--color-gold-muted)",
                                            color: "var(--color-gold)",
                                            border: "1px solid rgba(198,167,94,0.2)",
                                        }}>
                                        {getRoleLabel(user.role)}
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                                        style={{
                                            background: user.active ? "rgba(94,168,122,0.1)" : "rgba(224,85,85,0.1)",
                                            color: user.active ? "var(--color-success)" : "var(--color-error)",
                                        }}>
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: user.active ? "var(--color-success)" : "var(--color-error)" }} />
                                        {user.active ? "Activo" : "Inactivo"}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => openEditModal(user)} className="p-2 rounded-lg transition-colors border border-transparent hover:border-gold/30 hover:bg-gold/10" style={{ color: "var(--color-text-muted)" }}>
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} className="p-2 rounded-lg transition-colors border border-transparent hover:border-red-500/30 hover:bg-red-500/10" style={{ color: "var(--color-text-muted)" }}>
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
                    <div className="relative w-full max-w-md rounded-2xl p-8 animate-slide-up" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                        <h2 className="text-2xl font-light mb-6" style={{ fontFamily: "var(--font-cormorant)" }}>
                            {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                        </h2>

                        {error && (
                            <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(224,85,85,0.1)", border: "1px solid rgba(224,85,85,0.3)", color: "var(--color-error)" }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Nombre Completo</label>
                                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Email</label>
                                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Contraseña {editingUser && "(dejar en blanco para no cambiar)"}</label>
                                <input required={!editingUser} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Rol</label>
                                    <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm">
                                        <option value="READER">Lectura</option>
                                        <option value="EDITOR">Editor</option>
                                        <option value="MANAGER">Gestor</option>
                                        <option value="ADMIN">Administrador</option>
                                    </select>
                                </div>
                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-2 cursor-pointer py-3">
                                        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-gold w-4 h-4" />
                                        <span className="text-sm">Usuario Activo</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: "var(--color-surface-4)", color: "var(--color-text-muted)" }}>
                                    Cancelar
                                </button>
                                <button disabled={saving} type="submit" className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                                    style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))", color: "#000" }}>
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    {editingUser ? "Actualizar" : "Crear Usuario"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

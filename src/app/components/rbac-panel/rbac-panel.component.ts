import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
	IonCard,
	IonCardHeader,
	IonCardTitle,
	IonCardContent,
	IonList,
	IonItem,
	IonLabel,
	IonInput,
	IonTextarea,
	IonButton,
	IonIcon,
	IonSearchbar,
	IonSelect,
	IonSelectOption,
	IonToggle,
	IonSegment,
	IonSegmentButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, saveOutline, closeOutline, personOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { RbacService, AppUser, RoleName, RolePermission } from '../../services/rbac.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

type AppRole = 'IT Admin' | 'Lead Developer' | 'Developer' | string;

@Component({
	selector: 'app-rbac-panel',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		IonCard,
		IonCardHeader,
		IonCardTitle,
		IonCardContent,
		IonList,
		IonItem,
		IonLabel,
		IonInput,
		IonTextarea,
		IonButton,
		IonIcon,
		IonSearchbar,
		IonSelect,
		IonSelectOption,
		IonToggle,
		IonSegment,
		IonSegmentButton
	],
	templateUrl: './rbac-panel.component.html',
	styleUrls: ['./rbac-panel.component.scss']
})
export class RbacPanelComponent implements OnInit {
	role: AppRole = '';
	currentUserId = 0;

	users = signal<AppUser[]>([]);
	roles = signal<RoleName[]>(['IT Admin', 'Lead Developer', 'Developer']);
	search = signal<string>('');
	filterRole = signal<RoleName | 'All'>('All');
	selectedRoleForPermissions = signal<RoleName>('Developer');
	permissions = signal<RolePermission[]>([]);

	filteredUsers = computed(() => {
		const q = this.search().toLowerCase().trim();
		const roleFilter = this.filterRole();
		return this.users().filter(u => {
			const matchesQ = !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.role || '').toLowerCase().includes(q);
			const matchesRole = roleFilter === 'All' || (u.role || '').toLowerCase() === (roleFilter || '').toLowerCase();
			return matchesQ && matchesRole;
		});
	});

	createForm: FormGroup;
	editForm: FormGroup;

	get isItAdmin(): boolean { return this.normalizeRole(this.role) === 'itadmin'; }
	get isLeadDev(): boolean { return this.normalizeRole(this.role) === 'leaddeveloper'; }
	get canManageUsers(): boolean { return this.isItAdmin; }
	get canAssignDeveloperOnly(): boolean { return this.isLeadDev; }

	constructor(
		private rbac: RbacService,
		private auth: AuthService,
		private toast: ToastService,
		private fb: FormBuilder
	) {
		addIcons({ addOutline, createOutline, trashOutline, saveOutline, closeOutline, personOutline, shieldCheckmarkOutline });
		this.createForm = this.fb.group({
			username: ['', [Validators.required, Validators.minLength(3)]],
			email: ['', [Validators.required, Validators.email]],
			password: ['', [Validators.required, Validators.minLength(6)]],
			role: ['Developer', [Validators.required]]
		});
		this.editForm = this.fb.group({
			username: ['', [Validators.required, Validators.minLength(3)]],
			email: ['', [Validators.required, Validators.email]],
			role: ['Developer', [Validators.required]]
		});
	}

	ngOnInit(): void {
		const user = this.auth.getCurrentUser();
		this.role = (user?.role || (user as any)?.Role || '') as AppRole;
		this.currentUserId = (user?.userId || (user as any)?.UserId || 0) as number;
		this.loadUsers();
		this.loadRoles();
		this.loadRolePermissions(this.selectedRoleForPermissions());
	}

	private normalizeRole(r: string): string { return (r || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

	loadUsers(): void {
		this.rbac.getUsers().subscribe({
			next: users => this.users.set(users || []),
			error: () => this.toast.showError('Failed to load users')
		});
	}

	loadRoles(): void {
		this.rbac.getRoles().subscribe({
			next: rs => { if (Array.isArray(rs) && rs.length) this.roles.set(rs); },
			error: () => {}
		});
	}

	loadRolePermissions(role: RoleName): void {
		this.selectedRoleForPermissions.set(role);
		this.rbac.getRolePermissions(role).subscribe({
			next: p => this.permissions.set(p || []),
			error: () => this.permissions.set([
				{ resource: 'users', create: false, read: true, update: false, delete: false },
				{ resource: 'roles', create: false, read: true, update: false, delete: false },
				{ resource: 'categories', create: true, read: true, update: true, delete: true },
				{ resource: 'topics', create: true, read: true, update: true, delete: true },
				{ resource: 'subtopics', create: true, read: true, update: true, delete: true }
			])
		});
	}

	createUser(): void {
		if (!this.canManageUsers || this.createForm.invalid) return;
		this.rbac.createUser(this.createForm.value).subscribe({
			next: () => { this.toast.showSuccess('User created'); this.createForm.reset({ role: 'Developer' }); this.loadUsers(); },
			error: () => this.toast.showError('Failed to create user')
		});
	}

	startEdit(u: AppUser): void {
		this.editForm.reset({ username: u.username, email: u.email, role: u.role });
		this._editingId = u.userId;
	}

	private _editingId: number | null = null;
	saveEdit(): void {
		if (this._editingId == null || this.editForm.invalid) return;
		const isSelf = this._editingId === this.currentUserId;
		const desiredRole = this.editForm.value.role as RoleName;
		if (isSelf) { this.toast.showWarning('Cannot change your own user'); return; }
		if (this.canAssignDeveloperOnly && desiredRole && this.normalizeRole(desiredRole) !== 'developer') { this.toast.showWarning('Lead Developers can assign Developer role only'); return; }
		this.rbac.updateUser(this._editingId, { username: this.editForm.value.username, email: this.editForm.value.email, role: desiredRole }).subscribe({
			next: () => { this.toast.showSuccess('User updated'); this._editingId = null; this.loadUsers(); },
			error: () => this.toast.showError('Failed to update user')
		});
	}

	assignRole(u: AppUser, role: RoleName): void {
		const isSelf = u.userId === this.currentUserId;
		if (isSelf) { this.toast.showWarning('Cannot change your own role'); return; }
		if (!this.isItAdmin && this.canAssignDeveloperOnly && this.normalizeRole(role) !== 'developer') { this.toast.showWarning('Lead Developers can assign Developer role only'); return; }
		this.rbac.assignRole(u.userId, role).subscribe({
			next: () => { this.toast.showSuccess('Role updated'); this.loadUsers(); },
			error: () => this.toast.showError('Failed to update role')
		});
	}

	deleteUser(u: AppUser): void {
		if (!this.canManageUsers) return;
		if (u.userId === this.currentUserId) { this.toast.showWarning('You cannot delete yourself'); return; }
		this.rbac.deleteUser(u.userId).subscribe({
			next: () => { this.toast.showSuccess('User deleted'); this.loadUsers(); },
			error: () => this.toast.showError('Failed to delete user')
		});
	}

	savePermissions(): void {
		if (!this.isItAdmin) { this.toast.showWarning('Only IT Admin can change permissions'); return; }
		this.rbac.updateRolePermissions(this.selectedRoleForPermissions(), this.permissions()).subscribe({
			next: () => this.toast.showSuccess('Permissions updated'),
			error: () => this.toast.showError('Failed to update permissions')
		});
	}

	// Toggle handler to avoid complex expressions in template
	onPermToggle(index: number, field: 'create' | 'read' | 'update' | 'delete', checked: boolean): void {
		this.permissions.update(current => {
			const list = Array.isArray(current) ? [...current] as RolePermission[] : [] as RolePermission[];
			if (!list[index]) return current;
			list[index] = { ...list[index], [field]: checked } as RolePermission;
			return list;
		});
	}
}



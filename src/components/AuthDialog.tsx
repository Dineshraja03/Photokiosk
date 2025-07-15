import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const ROLES = [
	{
		key: "photographer",
		label: "Photographer",
		description: "Upload and manage photo sessions",
		color: "blue",
		iconBg: "bg-blue-100",
		btnBg: "bg-blue-600 hover:bg-blue-700",
		icon: (
			<svg
				className="stroke-blue-600"
				xmlns="http://www.w3.org/2000/svg"
				width="32"
				height="32"
				viewBox="0 0 32 32"
			>
				<circle cx="16" cy="16" r="12" fill="none" strokeWidth="4" />
				<rect x="10" y="14" width="12" height="8" rx="2" fill="#3b82f6" />
				<circle cx="16" cy="18" r="2" fill="white" />
			</svg>
		),
	},
	{
		key: "operator",
		label: "Operator",
		description: "Assist customers with printing and editing",
		color: "green",
		iconBg: "bg-green-100",
		btnBg: "bg-green-600 hover:bg-green-700",
		icon: (
			<svg
				className="stroke-green-600"
				xmlns="http://www.w3.org/2000/svg"
				width="32"
				height="32"
				viewBox="0 0 32 32"
			>
				<circle cx="16" cy="16" r="12" fill="none" strokeWidth="4" />
				<rect x="10" y="14" width="12" height="8" rx="2" fill="#22c55e" />
				<circle cx="16" cy="18" r="2" fill="white" />
			</svg>
		),
	},
	{
		key: "admin",
		label: "Admin",
		description: "Manage system settings and users",
		color: "purple",
		iconBg: "bg-purple-100",
		btnBg: "bg-purple-600 hover:bg-purple-700",
		icon: (
			<svg
				className="stroke-purple-600"
				xmlns="http://www.w3.org/2000/svg"
				width="32"
				height="32"
				viewBox="0 0 32 32"
			>
				<circle cx="16" cy="16" r="12" fill="none" strokeWidth="4" />
				<rect x="10" y="14" width="12" height="8" rx="2" fill="#a855f7" />
				<circle cx="16" cy="18" r="2" fill="white" />
			</svg>
		),
	},
];

function AuthDialog({ onLogin }: { onLogin?: (role: string, username?: string) => void }) {
	const [selectedRole, setSelectedRole] = useState<string | null>(null);
	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");

	// First page: role selection
	if (!selectedRole) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-background">
				<div className="flex flex-col items-center mb-8">
					<div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
						<svg
							className="stroke-white"
							xmlns="http://www.w3.org/2000/svg"
							width="40"
							height="40"
							viewBox="0 0 32 32"
							aria-hidden="true"
						>
							<circle cx="16" cy="16" r="12" fill="none" strokeWidth="4" />
							<rect x="10" y="14" width="12" height="8" rx="2" fill="white" />
							<circle cx="16" cy="18" r="2" fill="#6366f1" />
						</svg>
					</div>
					<h1 className="text-3xl font-extrabold text-center mb-2 tracking-tight">
						PhotoKiosk Pro
					</h1>
					<p className="text-base text-muted-foreground text-center mb-6">
						Professional Studio Management System
					</p>
				</div>
				<div className="flex flex-col md:flex-row gap-4 justify-center items-center w-full max-w-3xl">
					{ROLES.map((role) => (
						<div
							key={role.key}
							className="flex flex-col items-center bg-white rounded-xl shadow-xl p-5 w-72 scale-100 hover:scale-105 transition-transform duration-200 border border-blue-100"
						>
							<div
								className={`flex size-12 items-center justify-center rounded-lg ${role.iconBg} mb-3`}
							>
								{role.icon}
							</div>
							<h2 className="text-lg font-bold mb-1">{role.label}</h2>
							<p className="text-sm text-muted-foreground mb-4 text-center">
								{role.description}
							</p>
							<Button
								className={`w-full h-10 text-base ${role.btnBg}`}
								onClick={() => setSelectedRole(role.key)}
							>
								Login as {role.label}
							</Button>
						</div>
					))}
				</div>
			</div>
		);
	}

	// Second page: login form for selected role
	const roleObj = ROLES.find((r) => r.key === selectedRole);
	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="w-full max-w-[350px] p-6 border bg-background rounded-xl shadow-xl shadow-black/5 flex flex-col items-center">
				<div className="flex flex-col items-center gap-2 mb-6">
					<div
						className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${roleObj?.iconBg}`}
					>
						{roleObj?.icon}
					</div>
					<h2 className="text-xl font-bold tracking-tight text-center">
						Login as {roleObj?.label}
					</h2>
				</div>
				<form
					className="space-y-6 w-full"
					onSubmit={(e) => {
						e.preventDefault();
						onLogin && onLogin(selectedRole!, username);
					}}
				>
					<div className="space-y-4">
						<div className="space-y-1">
							<Label htmlFor="username" className="text-base">Username</Label>
							<Input
								id="username"
								placeholder="Enter your username"
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
								className="h-10 text-sm"
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="password" className="text-base">Password</Label>
							<Input
								id="password"
								placeholder="Enter your password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="h-10 text-sm"
							/>
						</div>
					</div>
					<Button type="submit" className={`w-full h-10 text-base mt-2 ${roleObj?.btnBg}`}>
						Sign in
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="w-full h-10 text-base mt-1"
						onClick={() => setSelectedRole(null)}
					>
						Back
					</Button>
				</form>
			</div>
		</div>
	);
}

export { AuthDialog };
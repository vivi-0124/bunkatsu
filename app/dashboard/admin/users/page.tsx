"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { client } from "@/lib/rpc";

type User = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: string | number | Date;
};

const roleColors: Record<string, string> = {
  admin: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  tutor: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  student: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
};

export default function UsersManagement() {
  const [users, setUsers] = useState<User[] | undefined>(undefined);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await client.api.users.$get();
      if (res.ok) {
        const data = await res.json();
        setUsers(data as User[]);
      }
    };
    fetchUsers();
  }, []);

  async function updateRole(userId: string, newRole: string) {
    setUpdatingUserId(userId);
    try {
      const res = await client.api.users[":id"].role.$patch({
        param: { id: userId },
        json: { role: newRole as "admin" | "tutor" | "student" },
      });
      if (res.ok) {
        const resUsers = await client.api.users.$get();
        if (resUsers.ok) {
          const data = await resUsers.json();
          setUsers(data as User[]);
        }
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setUpdatingUserId(null);
    }
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/admin">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Users</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">ユーザー管理</h1>
          <Badge variant="secondary">{users?.length || 0} ユーザー</Badge>
        </div>

        {users === undefined ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>メール</TableHead>
                  <TableHead>ロール</TableHead>
                  <TableHead>作成日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role || "student"}
                        onValueChange={(value: string) =>
                          updateRole(user.id, value)
                        }
                        disabled={updatingUserId === user.id}
                      >
                        <SelectTrigger className="w-[120px]">
                          {updatingUserId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColors.admin}`}
                            >
                              Admin
                            </span>
                          </SelectItem>
                          <SelectItem value="tutor">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColors.tutor}`}
                            >
                              Tutor
                            </span>
                          </SelectItem>
                          <SelectItem value="student">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColors.student}`}
                            >
                              Student
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}

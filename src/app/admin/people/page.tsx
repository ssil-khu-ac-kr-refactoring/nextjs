'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import Loading from '@/components/Loading';
interface Person {
  id: number;
  name: string;
  position: string;
  email: string;
  role: string;
}

export default function ManagePeoplePage() {
  noStore();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
 
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState<keyof Person>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const res = await fetch('/api/people');
        if (!res.ok) {
          throw new Error('Failed to fetch people');
        }
        const data = await res.json();
        setPeople(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPeople();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      try {
        const res = await fetch(`/api/people/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          throw new Error('Failed to delete person');
        }
        setPeople(people.filter((p) => p.id !== id));
      } catch (err) {
        setError(err.message);
      }
    }
  };

   //  검색 + 필터 적용된 결과
  const filteredPeople = people.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      roleFilter === 'ALL' ? true : p.role.toUpperCase() === roleFilter;
    return matchesSearch && matchesRole;
  });
    // 정렬 적용
  const sortedPeople = [...filteredPeople].sort((a, b) => {
    const valA = a[sortKey]?.toString().toLowerCase();
    const valB = b[sortKey]?.toString().toLowerCase();
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });


  if (loading) return <Loading />;
  if (error) return <div>Error: {error}</div>;
return (
    <div className="container mx-auto px-4">
      {/* 상단 컨트롤 바 */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
        <h1 className="text-3xl font-bold">Manage People</h1>

        <div className="flex flex-wrap items-center gap-2">
          {/* 🔍 검색 */}
          <input
            type="text"
            placeholder="Search by name or position"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />

          {/* 🎚 Role 필터 */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="ALL">All Roles</option>
            <option value="CURRENT">Current</option>
            <option value="ALUMNI">Alumni</option>
            <option value="PROFESSOR">Professor</option>
          </select>

          {/* 🔽 정렬 */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as keyof Person)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="position">Sort by Position</option>
            <option value="role">Sort by Role</option>
          </select>

          {/* ⬆⬇ 정렬 방향 토글 */}
          <button
            onClick={() =>
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
            }
            className="border rounded px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200"
          >
            {sortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}
          </button>

          {/* ➕ 추가 버튼 */}
          <Link
            href="/admin/people/new"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-xl"
          >
            Add New Person
          </Link>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-card rounded-2xl border border-border">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {sortedPeople.map((person) => (
              <tr key={person.id}>
                <td className="px-6 py-4 whitespace-nowrap">{person.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{person.position}</td>
                <td className="px-6 py-4 whitespace-nowrap">{person.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{person.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => router.push(`/admin/people/edit/${person.id}`)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(person.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedPeople.length === 0 && (
          <div className="text-center py-8 text-foreground/60">
            No matching people found.
          </div>
        )}
      </div>
    </div>
  );
}
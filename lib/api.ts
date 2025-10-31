const BASE_URL = 'https://api.example.com';

export async function registerUser(data: {
    fullName: string;
    email: string;
    password: string;
    role: "student" | "teacher";
}) {
    const res = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return await res.json();
}

export async function loginUser(data: {
    email: string;
    password: string;
}) {
    const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return await res.json();
}
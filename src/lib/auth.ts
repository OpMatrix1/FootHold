import { supabase, type Role } from './supabase';

type SignupInput = {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  orgName?: string;
  orgDescription?: string;
};

function getEmailRedirectTo() {
  if (typeof window === 'undefined') return undefined;
  return new URL(`${import.meta.env.BASE_URL}#/app`, window.location.origin).toString();
}

export async function signUp(input: SignupInput) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: getEmailRedirectTo(),
      data: {
        full_name: input.fullName,
        role: input.role,
        org_name: input.orgName,
        org_description: input.orgDescription,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

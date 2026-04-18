import { createClient } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Profile = {
  id: string;
  full_name: string | null;
  created_at: string;
};

export type Restaurant = {
  id: string;
  owner_id: string;
  legal_name: string;
  dba: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  entity_type: string | null;
  ein: string | null;
  alcohol_service: boolean;
  alcohol_type: string | null;
  seating_capacity: number | null;
  created_at: string;
};

export type Permit = {
  id: string;
  restaurant_id: string;
  permit_type: string;
  agency: string | null;
  status: 'pending' | 'active' | 'expiring' | 'expired';
  issue_date: string | null;
  expiry_date: string | null;
  permit_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Staff = {
  id: string;
  restaurant_id: string;
  full_name: string;
  role: string | null;
  food_handler_card_expiry: string | null;
  servsafe_expiry: string | null;
  created_at: string;
};

export type PermitPacket = {
  id: string;
  restaurant_id: string;
  generated_at: string;
  permits_included: string[] | null;
  storage_path: string | null;
};

export type Subscription = {
  id: string;
  owner_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  tier: 'free' | 'pro' | 'command' | null;
  status: 'active' | 'past_due' | 'canceled' | null;
  current_period_end: string | null;
  created_at: string;
};

export type FormVersion = {
  id: string;
  form_name: string;
  source_url: string;
  current_hash: string;
  last_fetched_at: string | null;
  last_changed_at: string | null;
  status: 'verified' | 'pending_review' | 'flagged';
  admin_notified: boolean;
};

export type AISuggestion = {
  id: string;
  restaurant_id: string;
  module: string | null;
  prompt: string | null;
  response: string | null;
  created_at: string;
};

export type Vendor = {
  id: string;
  restaurant_id: string;
  name: string;
  category: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
};

export type RevenueEntry = {
  id: string;
  restaurant_id: string;
  entry_date: string;
  gross_revenue: number | null;
  cogs: number | null;
  labor_cost: number | null;
  net_margin: number | null;
  notes: string | null;
  created_at: string;
};

// ---------------------------------------------------------------------------
// Profile queries
// ---------------------------------------------------------------------------

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function upsertProfile(profile: Partial<Profile> & { id: string }): Promise<void> {
  const supabase = createClient();
  await supabase.from('profiles').upsert(profile);
}

// ---------------------------------------------------------------------------
// Restaurant queries
// ---------------------------------------------------------------------------

export async function getRestaurants(): Promise<Restaurant[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getRestaurant(id: string): Promise<Restaurant | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

export async function createRestaurant(
  restaurant: Omit<Restaurant, 'id' | 'created_at'>
): Promise<Restaurant | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('restaurants')
    .insert(restaurant)
    .select()
    .single();
  return data;
}

export async function updateRestaurant(
  id: string,
  updates: Partial<Omit<Restaurant, 'id' | 'owner_id' | 'created_at'>>
): Promise<void> {
  const supabase = createClient();
  await supabase.from('restaurants').update(updates).eq('id', id);
}

// ---------------------------------------------------------------------------
// Permit queries
// ---------------------------------------------------------------------------

export async function getPermits(restaurantId: string): Promise<Permit[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('permits')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function createPermit(
  permit: Omit<Permit, 'id' | 'created_at' | 'updated_at'>
): Promise<Permit | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('permits')
    .insert(permit)
    .select()
    .single();
  return data;
}

export async function updatePermit(
  id: string,
  updates: Partial<Omit<Permit, 'id' | 'restaurant_id' | 'created_at'>>
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from('permits')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
}

// ---------------------------------------------------------------------------
// Staff queries
// ---------------------------------------------------------------------------

export async function getStaff(restaurantId: string): Promise<Staff[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('staff')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('full_name');
  return data ?? [];
}

export async function createStaffMember(
  member: Omit<Staff, 'id' | 'created_at'>
): Promise<Staff | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('staff')
    .insert(member)
    .select()
    .single();
  return data;
}

export async function updateStaffMember(
  id: string,
  updates: Partial<Omit<Staff, 'id' | 'restaurant_id' | 'created_at'>>
): Promise<void> {
  const supabase = createClient();
  await supabase.from('staff').update(updates).eq('id', id);
}

export async function deleteStaffMember(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('staff').delete().eq('id', id);
}

// ---------------------------------------------------------------------------
// Permit packet queries
// ---------------------------------------------------------------------------

export async function getPermitPackets(restaurantId: string): Promise<PermitPacket[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('permit_packets')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('generated_at', { ascending: false });
  return data ?? [];
}

export async function createPermitPacket(
  packet: Omit<PermitPacket, 'id' | 'generated_at'>
): Promise<PermitPacket | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('permit_packets')
    .insert(packet)
    .select()
    .single();
  return data;
}

// ---------------------------------------------------------------------------
// Subscription queries
// ---------------------------------------------------------------------------

export async function getSubscription(ownerId: string): Promise<Subscription | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('owner_id', ownerId)
    .single();
  return data;
}

// ---------------------------------------------------------------------------
// Form version queries
// ---------------------------------------------------------------------------

export async function getFormVersion(formName: string): Promise<FormVersion | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('form_versions')
    .select('*')
    .eq('form_name', formName)
    .single();
  return data;
}

// ---------------------------------------------------------------------------
// AI suggestions — append-only audit log, never update or delete
// ---------------------------------------------------------------------------

export async function logAISuggestion(
  restaurantId: string,
  module: string,
  prompt: string,
  response: string
): Promise<void> {
  const supabase = createClient();
  await supabase.from('ai_suggestions').insert({
    restaurant_id: restaurantId,
    module,
    prompt,
    response,
  });
}

export async function getAISuggestions(restaurantId: string): Promise<AISuggestion[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('ai_suggestions')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Vendor queries
// ---------------------------------------------------------------------------

export async function getVendors(restaurantId: string): Promise<Vendor[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('vendors')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name');
  return data ?? [];
}

export async function createVendor(
  vendor: Omit<Vendor, 'id' | 'created_at'>
): Promise<Vendor | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('vendors')
    .insert(vendor)
    .select()
    .single();
  return data;
}

export async function updateVendor(
  id: string,
  updates: Partial<Omit<Vendor, 'id' | 'restaurant_id' | 'created_at'>>
): Promise<void> {
  const supabase = createClient();
  await supabase.from('vendors').update(updates).eq('id', id);
}

export async function deleteVendor(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('vendors').delete().eq('id', id);
}

// ---------------------------------------------------------------------------
// Revenue entry queries
// ---------------------------------------------------------------------------

export async function getRevenueEntries(restaurantId: string): Promise<RevenueEntry[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('revenue_entries')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('entry_date', { ascending: false });
  return data ?? [];
}

export async function createRevenueEntry(
  entry: Omit<RevenueEntry, 'id' | 'created_at'>
): Promise<RevenueEntry | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('revenue_entries')
    .insert(entry)
    .select()
    .single();
  return data;
}

export async function updateRevenueEntry(
  id: string,
  updates: Partial<Omit<RevenueEntry, 'id' | 'restaurant_id' | 'created_at'>>
): Promise<void> {
  const supabase = createClient();
  await supabase.from('revenue_entries').update(updates).eq('id', id);
}

import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const name = String(formData.get('name') ?? '').trim();
  const image = formData.get('image');
  const rawBasePrice = formData.get('base_price');

  if (!name) {
    return NextResponse.json({ message: 'Name is required.' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  let cardImageUrl: string | null = null;

  if (image instanceof File && image.size > 0) {
    const extension = image.name.split('.').pop() || 'png';
    const fileName = `${slugify(name)}-${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from('player-cards').upload(fileName, image, {
      contentType: image.type,
      upsert: false
    });

    if (uploadError) {
      return NextResponse.json({ message: 'Image upload failed.' }, { status: 500 });
    }

    const { data } = supabase.storage.from('player-cards').getPublicUrl(fileName);
    cardImageUrl = data.publicUrl;
  }

  const updateData: Record<string, unknown> = { name };

  if (cardImageUrl) {
    updateData.card_image_url = cardImageUrl;
  }

  if (rawBasePrice) {
    const parsed = parseInt(String(rawBasePrice), 10);
    if (!isNaN(parsed) && parsed >= 0) {
      updateData.base_price = parsed;
    }
  }

  const { error } = await supabase.from('players').update(updateData).eq('id', id);

  if (error) {
    return NextResponse.json({ message: 'Could not update player.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Player updated successfully.' });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerSupabase();

  const { error } = await supabase.from('players').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ message: 'Could not delete player.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Player deleted successfully.' });
}

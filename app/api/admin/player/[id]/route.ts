import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { slugify, currency } from '@/lib/utils';
import { getYearTier } from '@/lib/constants';
import type { PlayerYear } from '@/lib/types';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const name = String(formData.get('name') ?? '').trim();
  const yearRaw = formData.get('year');
  const image = formData.get('image');

  const year = yearRaw as PlayerYear;
  const yearTier = getYearTier(year);

  if (!name || !yearTier) {
    return NextResponse.json({ message: 'Name and year are required.' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  let cardImageUrl: string | null = null;

  if (image instanceof File && image.size > 0) {
    const extension = image.name.split('.').pop() || 'png';
    const fileName = `${slugify(name)}-${randomUUID()}.${extension}`;
    const fileBuffer = Buffer.from(await image.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from('player-cards').upload(fileName, fileBuffer, {
      contentType: image.type,
      upsert: false
    });

    if (uploadError) {
      return NextResponse.json({ message: 'Image upload failed.' }, { status: 500 });
    }

    const { data } = supabase.storage.from('player-cards').getPublicUrl(fileName);
    cardImageUrl = data.publicUrl;
  }

  const updateData: Record<string, unknown> = {
    name,
    year,
    base_price: yearTier.basePrice
  };

  if (cardImageUrl) {
    updateData.card_image_url = cardImageUrl;
  }

  const { error } = await supabase.from('players').update(updateData).eq('id', id);

  if (error) {
    return NextResponse.json({ message: 'Could not update player.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Player updated successfully.' });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
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

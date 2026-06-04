import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const name = String(formData.get('name') ?? '').trim();
  const division = String(formData.get('division') ?? '').trim();
  const position = String(formData.get('position') ?? '').trim();
  const image = formData.get('image');

  if (!name || !division || !position) {
    return NextResponse.json({ message: 'Name, division, and position are required.' }, { status: 400 });
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

  const { error } = await supabase.from('players').insert({
    name,
    division,
    category: position,
    base_price: 50,
    card_image_url: cardImageUrl,
    created_by: session.userId
  });

  if (error) {
    return NextResponse.json({ message: 'Could not create player.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Player created successfully.' });
}

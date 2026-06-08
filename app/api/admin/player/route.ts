import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export async function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const name = String(formData.get('name') ?? '').trim();
  const division = String(formData.get('division') ?? '').trim();
  const image = formData.get('image');
  const basePrice = parseInt(String(formData.get('base_price') ?? ''), 10) || 50;

  if (!name || !division) {
    return NextResponse.json({ message: 'Name and division are required.' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  let cardImageUrl: string | null = null;

  if (image instanceof File && image.size > 0) {
    if (image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ message: 'Image must be under 4MB.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(image.type)) {
      return NextResponse.json({ message: 'Image must be JPEG, PNG, WebP, GIF, or AVIF.' }, { status: 400 });
    }

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

  const { error } = await supabase.from('players').insert({
    name,
    division,
    base_price: basePrice,
    card_image_url: cardImageUrl,
    created_by: session.userId
  });

  if (error) {
    return NextResponse.json({ message: 'Could not create player.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Player created successfully.' });
}

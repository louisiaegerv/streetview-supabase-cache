// utils/imageUtils.ts
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabaseClient'; // Adjust the path as necessary

export async function downloadImage(url: string): Promise<Buffer> {
  try {
    const { data } = await axios.get(url, {
      responseType: 'arraybuffer',
    });
    return Buffer.from(data, 'binary');
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

export async function uploadImage(
  imageBuffer: Buffer,
  bucketName: string
): Promise<string> {
  try {
    const fileName = `${uuidv4()}.jpg`;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
      });

    if (error) {
      console.error('Error uploading image to Supabase:', error);
      throw error;
    }

    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${fileName}`;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

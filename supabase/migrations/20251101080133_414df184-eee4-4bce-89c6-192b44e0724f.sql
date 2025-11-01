-- Create storage bucket for contestant images
insert into storage.buckets (id, name, public)
values ('contestant-images', 'contestant-images', true);

-- Allow authenticated users to view images
create policy "Anyone can view contestant images"
on storage.objects for select
using (bucket_id = 'contestant-images');

-- Allow admins to upload contestant images
create policy "Admins can upload contestant images"
on storage.objects for insert
with check (
  bucket_id = 'contestant-images' 
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);

-- Allow admins to delete contestant images
create policy "Admins can delete contestant images"
on storage.objects for delete
using (
  bucket_id = 'contestant-images'
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);
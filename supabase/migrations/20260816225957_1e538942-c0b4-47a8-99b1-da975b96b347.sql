-- Originally granted admin to the clinic owner's account in the production database.
-- Guarded so it is a no-op on a fresh database where that user doesn't exist.
-- To create the first admin on a new project, see HANDOVER.md ("First admin user").
insert into public.user_roles (user_id, role)
select '5d373063-6365-4ae0-bce7-3b080a9a53a5', 'admin'
where exists (select 1 from auth.users where id = '5d373063-6365-4ae0-bce7-3b080a9a53a5')
on conflict (user_id, role) do nothing;

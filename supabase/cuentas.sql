-- Panel de administración: gestionar las cuentas de la gente.
-- Todas las funciones comprueban es_admin(); a un administrador no se le puede bloquear ni borrar desde aquí.

-- Lista de cuentas con lo que hace falta para moderar (el correo solo lo ve el administrador)
create or replace function public.admin_listar_usuarios()
returns table (
  id uuid, nombre text, avatar_url text, email text, proveedor text,
  creado timestamptz, ultimo_acceso timestamptz, bloqueado boolean,
  xp int, nivel int, precios int, notas int, admin boolean
)
language sql stable security definer set search_path = public as $$
  select u.id, p.nombre, p.avatar_url, u.email::text,
         coalesce(u.raw_app_meta_data ->> 'provider', 'email'),
         u.created_at, u.last_sign_in_at,
         coalesce(u.banned_until > now(), false),
         coalesce(p.xp, 0), coalesce(p.nivel, 1),
         (select count(*)::int from resenas r where r.user_id = u.id),
         (select count(*)::int from notas n where n.user_id = u.id),
         exists (select 1 from admins a where a.user_id = u.id)
  from auth.users u
  left join perfiles p on p.id = u.id
  where public.es_admin()
  order by u.created_at desc
$$;

-- Cambiar el nombre que se ve en el ranking, las notas y la corona del bar
create or replace function public.admin_renombrar_usuario(p_id uuid, p_nombre text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'Solo administradores'; end if;
  if char_length(btrim(coalesce(p_nombre, ''))) not between 2 and 40 then
    raise exception 'El nombre tiene que tener entre 2 y 40 caracteres';
  end if;
  update perfiles set nombre = btrim(p_nombre) where id = p_id;
  if not found then raise exception 'Esta cuenta todavía no tiene perfil'; end if;
end $$;

-- Quitar la foto de perfil (por si es inapropiada)
create or replace function public.admin_quitar_foto(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'Solo administradores'; end if;
  update perfiles set avatar_url = '' where id = p_id;
end $$;

-- Bloquear / desbloquear: la persona no puede volver a entrar (la cuenta y sus datos se quedan)
create or replace function public.admin_bloquear_usuario(p_id uuid, p_bloquear boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'Solo administradores'; end if;
  if exists (select 1 from admins where user_id = p_id) then
    raise exception 'No se puede bloquear a un administrador';
  end if;
  update auth.users
     set banned_until = case when p_bloquear then now() + interval '100 years' else null end
   where id = p_id;
  if p_bloquear then
    delete from auth.sessions where user_id = p_id; -- le cierra la sesión en todos sus dispositivos
  end if;
end $$;

-- Borrar la cuenta. Sus notas se borran siempre; sus precios se borran o se quedan como anónimos.
create or replace function public.admin_borrar_usuario(p_id uuid, p_borrar_precios boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_bares uuid[];
begin
  if not es_admin() then raise exception 'Solo administradores'; end if;
  if exists (select 1 from admins where user_id = p_id) then
    raise exception 'No se puede borrar a un administrador';
  end if;

  if p_borrar_precios then
    select array_agg(distinct id_bar) into v_bares from resenas where user_id = p_id;
    delete from resenas where user_id = p_id;
    -- los bares que se quedan sin ningún precio desaparecen también
    delete from bares b
     where b.id = any (coalesce(v_bares, '{}'))
       and not exists (select 1 from resenas r where r.id_bar = b.id);
  else
    update resenas set user_id = null where user_id = p_id;
  end if;

  delete from perfiles where id = p_id;   -- sus notas se borran solas
  delete from auth.users where id = p_id; -- y la cuenta de acceso
end $$;


-- Notas cortas en cada bar (comentarios de la gente)
create table if not exists public.notas (
  id uuid primary key default gen_random_uuid(),
  id_bar uuid not null references public.bares(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  texto text not null check (char_length(btrim(texto)) between 2 and 140),
  creado timestamptz not null default now()
);
create index if not exists notas_bar_creado on public.notas (id_bar, creado desc);

alter table public.notas enable row level security;

drop policy if exists "Todos leen las notas" on public.notas;
create policy "Todos leen las notas" on public.notas for select using (true);

drop policy if exists "Cada uno escribe sus notas" on public.notas;
create policy "Cada uno escribe sus notas" on public.notas for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Cada uno borra las suyas y el admin todas" on public.notas;
create policy "Cada uno borra las suyas y el admin todas" on public.notas for delete to authenticated
  using (user_id = auth.uid() or public.es_admin());

-- Sin edición: nadie puede cambiar una nota ya publicada (no hay política de update)

-- Freno al spam: 3 notas al día por bar y 20 al día en total por persona
create or replace function public.limitar_notas() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from notas where user_id = new.user_id and id_bar = new.id_bar and creado > now() - interval '24 hours') >= 3 then
    raise exception 'Pon como mucho 3 notas al día en el mismo bar.';
  end if;
  if (select count(*) from notas where user_id = new.user_id and creado > now() - interval '24 hours') >= 20 then
    raise exception 'Has llegado al máximo de notas por hoy. Vuelve mañana.';
  end if;
  new.texto := btrim(new.texto);
  new.creado := now();
  return new;
end $$;

drop trigger if exists limitar_notas on public.notas;
create trigger limitar_notas before insert on public.notas
  for each row execute function public.limitar_notas();

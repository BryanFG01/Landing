// Iconos del admin (Phosphor, ya en el proyecto). Los de módulo se eligen en el constructor y se guardan por nombre.
import squares from '@phosphor-icons/core/assets/regular/squares-four.svg?raw';
import pkg from '@phosphor-icons/core/assets/regular/package.svg?raw';
import tag from '@phosphor-icons/core/assets/regular/tag.svg?raw';
import cart from '@phosphor-icons/core/assets/regular/shopping-cart.svg?raw';
import users from '@phosphor-icons/core/assets/regular/users.svg?raw';
import user from '@phosphor-icons/core/assets/regular/user.svg?raw';
import truck from '@phosphor-icons/core/assets/regular/truck.svg?raw';
import calendar from '@phosphor-icons/core/assets/regular/calendar-blank.svg?raw';
import chart from '@phosphor-icons/core/assets/regular/chart-bar.svg?raw';
import file from '@phosphor-icons/core/assets/regular/file-text.svg?raw';
import folder from '@phosphor-icons/core/assets/regular/folder.svg?raw';
import gear from '@phosphor-icons/core/assets/regular/gear.svg?raw';
import egg from '@phosphor-icons/core/assets/regular/egg.svg?raw';
import storefront from '@phosphor-icons/core/assets/regular/storefront.svg?raw';
import chat from '@phosphor-icons/core/assets/regular/chat-circle.svg?raw';
import star from '@phosphor-icons/core/assets/regular/star.svg?raw';
import money from '@phosphor-icons/core/assets/regular/money.svg?raw';
import mapPin from '@phosphor-icons/core/assets/regular/map-pin.svg?raw';
import plus from '@phosphor-icons/core/assets/regular/plus.svg?raw';
import pencil from '@phosphor-icons/core/assets/regular/pencil-simple.svg?raw';
import trash from '@phosphor-icons/core/assets/regular/trash.svg?raw';
import signOut from '@phosphor-icons/core/assets/regular/sign-out.svg?raw';
import moon from '@phosphor-icons/core/assets/regular/moon.svg?raw';
import sun from '@phosphor-icons/core/assets/regular/sun.svg?raw';
import house from '@phosphor-icons/core/assets/regular/house.svg?raw';
import wrench from '@phosphor-icons/core/assets/regular/wrench.svg?raw';
import userGear from '@phosphor-icons/core/assets/regular/user-gear.svg?raw';
import arrowUp from '@phosphor-icons/core/assets/regular/arrow-up.svg?raw';
import arrowDown from '@phosphor-icons/core/assets/regular/arrow-down.svg?raw';
import x from '@phosphor-icons/core/assets/regular/x.svg?raw';
import database from '@phosphor-icons/core/assets/regular/database.svg?raw';
import terminal from '@phosphor-icons/core/assets/regular/terminal-window.svg?raw';
import palette from '@phosphor-icons/core/assets/regular/palette.svg?raw';
import upload from '@phosphor-icons/core/assets/regular/upload-simple.svg?raw';
import download from '@phosphor-icons/core/assets/regular/download-simple.svg?raw';
import image from '@phosphor-icons/core/assets/regular/image.svg?raw';
import paperclip from '@phosphor-icons/core/assets/regular/paperclip.svg?raw';
import table from '@phosphor-icons/core/assets/regular/table.svg?raw';
import lock from '@phosphor-icons/core/assets/regular/lock-simple.svg?raw';
import eye from '@phosphor-icons/core/assets/regular/eye.svg?raw';
import code from '@phosphor-icons/core/assets/regular/code.svg?raw';
import * as React from 'react';

const SVG = {
  squares,
  package: pkg,
  tag,
  'shopping-cart': cart,
  users,
  user,
  truck,
  calendar,
  chart,
  file,
  folder,
  gear,
  egg,
  storefront,
  chat,
  star,
  money,
  'map-pin': mapPin,
  plus,
  pencil,
  trash,
  'sign-out': signOut,
  moon,
  sun,
  house,
  wrench,
  'user-gear': userGear,
  'arrow-up': arrowUp,
  'arrow-down': arrowDown,
  x,
  database,
  terminal,
  palette,
  upload,
  download,
  image,
  paperclip,
  table,
  lock,
  eye,
  code,
} as const;

export type IconKey = keyof typeof SVG;

export function Icon({ name, className = 'size-4' }: { name: string | null | undefined; className?: string }) {
  const svg = SVG[(name ?? 'squares') as IconKey] ?? SVG.squares;
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 [&>svg]:size-full ${className}`}
      dangerouslySetInnerHTML={{ __html: svg.replace(/fill="#?\w+"/, 'fill="currentColor"') }}
    />
  );
}

/** El Sidebar de nuvo-ui recibe el icono como componente, no como elemento. */
export const iconComponent = (name: string | null | undefined) =>
  function SidebarIcon({ className }: { className?: string }) {
    return <Icon name={name} className={className} />;
  };

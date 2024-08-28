import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronsUpDown, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../ui/button';
import styles from './workspaces.module.scss';
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar';

const frameworks = [
  {
    value: 'next.js',
    label: 'Next.js',
  },
  {
    value: 'sveltekit',
    label: 'SvelteKit',
  },
  {
    value: 'nuxt.js',
    label: 'Nuxt.js',
  },
  {
    value: 'remix',
    label: 'Remix',
  },
  {
    value: 'astro',
    label: 'Astro',
  },
];

export function Workspaces() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const selectedFramework = frameworks.find(
    (framework) => framework.value === value
  );

  return (
    <div className={`sidebar__workspaces my-5 w-full`}>
      <label
        htmlFor="framework-combobox"
        className="block text-xs font-medium text-gray-700 mb-1"
      >
        Workspace
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedFramework ? (
              <div className="flex items-center">
                <Avatar className="mr-2 h-6 w-6 rounded-full bg-slate-400 flex items-center justify-center">
                  <AvatarImage className="rounded-full" alt="@shadcn" />
                  <AvatarFallback>CB</AvatarFallback>
                </Avatar>
                <span className="block truncate text-base text-xs font-semibold">
                  {selectedFramework.label}
                </span>
              </div>
            ) : (
              <span className="block truncate text-base font-semibold text-gray-400">
                Select framework...
              </span>
            )}
            <ChevronsUpDown className="ml-auto h-4 w-4 text-gray-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Search framework..." />
            <CommandList>
              <CommandEmpty>No framework found.</CommandEmpty>
              <CommandGroup>
                {frameworks.map((framework) => (
                  <CommandItem
                    className="cursor-pointer"
                    key={framework.value}
                    value={framework.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? '' : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Avatar className="mr-2 h-6 w-6">
                      <AvatarImage
                        className="rounded-full"
                        src="https://github.com/shadcn.png"
                        alt="@shadcn"
                      />
                      <AvatarFallback>
                        {framework.label.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    {framework.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default Workspaces;

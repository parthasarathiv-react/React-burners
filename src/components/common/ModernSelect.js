import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const ModernSelect = ({ options, value, onChange, placeholder = "Select option", className, direction = "down", icon: Icon }) => {
    const selectedOption = options.find(opt => opt.value === value) || options.find(opt => opt.label === value);

    return (
        <DropdownMenu className={className}>
            <DropdownMenuTrigger
                className={cn(
                    "w-full bg-ot-bg-top/50 border border-ot-border/50 text-white rounded-xl py-2 px-4 text-xs font-bold uppercase tracking-widest flex items-center justify-between transition-all hover:border-ot-action-top/50 focus:outline-none focus:border-ot-action-top shadow-inner h-full min-h-[44px] data-[state=open]:border-ot-action-top data-[state=open]:ring-2 data-[state=open]:ring-ot-action-top/10",
                    className
                )}
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon size={16} className="text-ot-text-muted/60" />}
                    <span className={cn(!selectedOption && "text-ot-text-muted")}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown size={14} className="text-ot-text-muted transition-transform duration-300 data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
                side={direction === "up" ? "top" : "bottom"}
                align="start"
                className="w-[var(--radix-dropdown-menu-trigger-width)] bg-ot-bg-mid border border-ot-border/50 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[9999] py-1 backdrop-blur-2xl text-white"
            >
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option.value || option.label}
                        onClick={() => onChange(option.value || option.label)}
                        className={cn(
                            "w-full px-4 py-2 text-[10px] uppercase tracking-widest transition-all flex items-center justify-between cursor-pointer focus:bg-ot-action-top/10 focus:text-white",
                            value === (option.value || option.label) ? "text-ot-action-top bg-ot-action-top/5 font-bold" : "text-ot-text-muted"
                        )}
                    >
                        {option.label}
                        {(value === option.value || value === option.label) && <Check size={12} />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ModernSelect;

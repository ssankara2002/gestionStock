"use client"

import { useState, useId } from "react"
import ReactSelect, { Props as ReactSelectProps, GroupBase, OptionsOrGroups } from "react-select"

export type SelectOption = { value: string; label: string }

type AppSelectProps<
  Option = SelectOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
> = ReactSelectProps<Option, IsMulti, Group> & {
  error?: boolean
  maxDisplayed?: number
}

const DEFAULT_MAX = 10

export function AppSelect<
  Option = SelectOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>({ error, maxDisplayed = DEFAULT_MAX, options, ...props }: AppSelectProps<Option, IsMulti, Group>) {
  const [inputValue, setInputValue] = useState("")
  const instanceId = useId()

  const visibleOptions: OptionsOrGroups<Option, Group> = (() => {
    if (!options) return []
    if (inputValue) {
      const q = inputValue.toLowerCase()
      return (options as Option[]).filter((o: any) =>
        o.label?.toLowerCase().includes(q)
      ) as OptionsOrGroups<Option, Group>
    }
    return (options as Option[]).slice(0, maxDisplayed) as OptionsOrGroups<Option, Group>
  })()

  return (
    <ReactSelect<Option, IsMulti, Group>
      {...props}
      instanceId={instanceId}
      options={visibleOptions}
      filterOption={null}
      noOptionsMessage={() => inputValue ? "Aucun résultat" : "Aucune option"}
      menuIsOpen={props.menuIsOpen}
      inputValue={inputValue}
      onInputChange={(val, action) => {
        setInputValue(val)
        props.onInputChange?.(val, action)
      }}
      classNamePrefix="rs"
      unstyled
      classNames={{
        control: ({ isFocused }) =>
          [
            "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm transition-colors",
            isFocused ? "border-primary ring-1 ring-primary outline-none" : "border-input",
            error ? "border-destructive" : "",
            props.isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-default",
          ].join(" "),
        placeholder: () => "text-muted-foreground",
        input: () => "text-foreground",
        singleValue: () => "text-foreground",
        multiValue: () => "bg-secondary rounded px-1 mr-1 text-secondary-foreground text-sm",
        multiValueLabel: () => "text-secondary-foreground",
        multiValueRemove: () => "hover:bg-destructive hover:text-destructive-foreground rounded ml-1 px-0.5",
        indicatorSeparator: () => "bg-border mx-1",
        dropdownIndicator: () => "text-muted-foreground hover:text-foreground",
        clearIndicator: () => "text-muted-foreground hover:text-foreground cursor-pointer",
        menu: () => "z-50 mt-1 rounded-md border border-border bg-popover shadow-md overflow-hidden",
        menuList: () => "py-1 text-sm max-h-[260px] overflow-y-auto",
        option: ({ isFocused, isSelected }) =>
          [
            "px-3 py-2 cursor-pointer",
            isSelected ? "bg-primary text-primary-foreground" : "",
            isFocused && !isSelected ? "bg-accent text-accent-foreground" : "",
          ].join(" "),
        noOptionsMessage: () => "px-3 py-4 text-center text-sm text-muted-foreground",
        loadingMessage: () => "px-3 py-4 text-center text-sm text-muted-foreground",
        groupHeading: () => "px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
      }}
      styles={{
        control: () => ({}),
        menu: () => ({}),
        option: () => ({}),
        placeholder: () => ({}),
        singleValue: () => ({}),
        input: () => ({}),
        valueContainer: () => ({ display: "flex", flex: 1, flexWrap: "wrap" as const, alignItems: "center", gap: "2px" }),
        indicatorsContainer: () => ({ display: "flex", alignItems: "center" }),
        multiValue: () => ({}),
        multiValueLabel: () => ({}),
        multiValueRemove: () => ({}),
        menuList: () => ({}),
        groupHeading: () => ({}),
        noOptionsMessage: () => ({}),
        loadingMessage: () => ({}),
      }}
      loadingMessage={() => "Chargement..."}
    />
  )
}

import { Fragment, useId, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { Label } from "./label";
import { Input } from "./input";
import { Chevron } from "~/components/icons";
import { FieldError } from "./fieldError";
import { useDialPadContext } from "~/lib/context/dialpad";
import { getCurrencySymbol } from "~/utils/helpers";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = {
  options: SelectOption[];
  placeholder?: string;
  name?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string | string[];
  defaultValue?: SelectOption;
  onChange?: void;
};

export const Select = ({
  options,
  name,
  placeholder = "",
  label,
  error,
  disabled = false,
  required = false,
  defaultValue = {
    label: "",
    value: "",
  },
  onChange,
}: SelectProps) => {
  const id = useId();
  const [internalValue, setInternalValue] =
    useState<SelectOption>(defaultValue);
  const [searchTerm, setSearchTerm] = useState("");
  const { setAssetCode } = useDialPadContext();

  const filteredOptions =
    searchTerm === ""
      ? options
      : options.filter((option) =>
          option.label
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(searchTerm.toLowerCase().replace(/\s+/g, ""))
        );

  return (
    <Combobox
      value={internalValue}
      onChange={(selected) => {
        if (name === "asset") {
          setAssetCode(getCurrencySymbol(selected.label));
        }
        setInternalValue(selected);
      }}
      disabled={disabled}
    >
      {name ? (
        <input type="hidden" name={name} value={internalValue.value} />
      ) : null}
      <div className="relative">
        {label ? (
          <Combobox.Label as={Label} htmlFor={id}>
            {label}
          </Combobox.Label>
        ) : null}
        <div className="relative w-16 text-xs">
          <Combobox.Input
            as={Input}
            id={id}
            required={required}
            className="bg-green-2 text-xs border-none rounded-full py-0 h-7"
            displayValue={(option: SelectOption) => option.label}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={placeholder}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            {({ open }) => (
              <Chevron
                className="w-3 h-3 transition-all duration-100"
                direction={open ? "down" : "left"}
                strokeWidth={3}
              />
            )}
          </Combobox.Button>
        </div>
        {error ? <FieldError error={error} /> : null}
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setSearchTerm("")}
        >
          <Combobox.Options className="absolute mt-1 max-h-60 w-16 text-xs overflow-auto rounded-md bg-green-2 shadow-lg focus:outline-none">
            {filteredOptions.length === 0 && searchTerm !== "" ? (
              <div className="select-none py-2 px-4">Nothing found.</div>
            ) : (
              filteredOptions.map((option) => (
                <Combobox.Option
                  key={option.value}
                  className={({ active }) =>
                    `relative select-none py-1 cursor-pointer px-4 hover:bg-white ${
                      active && "bg-white"
                    }`
                  }
                  value={option}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? "font-medium" : "font-normal"
                        }`}
                      >
                        {option.label}
                      </span>
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
};

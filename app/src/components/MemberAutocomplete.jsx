import { useState } from "react";

import styles from './stylesheets/MemberAutocomplete.module.css'

// Autocompletes member names from a list of user objects
const MemberAutocomplete = ({ members = [], onSelect }) => {
    const [inputValue, setInputValue] = useState('');
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');

    // Sort members by first and last name
    members.sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
    });


    // Format user name as "First Last" with capitalization
    const formatName = (user) => `${user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)} ${user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1)}`;

    const handleChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        onSelect(value)
        setSelectedUserId('');

        if (!value || value.trim() === '') {
            setFilteredOptions([]);
            return;
        }

        const results = members.filter((member) => {
            const name = formatName(member).toLowerCase();
            return name.startsWith(value.toLowerCase());
        });

        setFilteredOptions(results.slice(0, 10));
    };

    const handleSelect = (user) => {
        setInputValue(formatName(user));
        setFilteredOptions([]);
        setSelectedUserId(user._id || '');
        if (onSelect) onSelect(user);
    };

    return (
        <div>
            <input name="memberAutocomplete"
                type="text"
                placeholder="Search..."
                value={inputValue}
                onChange={handleChange}
                autoComplete="off"
            />
            {/* Hidden input so parent form can read selected user id as `user` */}
            <input type="hidden" name="user" value={selectedUserId} />

            {filteredOptions.length > 0 && (
                <ul className={styles.autoCompleteList}>
                    {filteredOptions.map((member) => (
                        <li  key={member._id} onClick={() => handleSelect(member)}>
                            {formatName(member)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MemberAutocomplete;
import { useMemo, useState } from 'react';

const STORAGE_KEY = 'mindtrace_safety_preferences_v1';

const DEFAULT_CONTACTS = [
    { id: 1, name: 'Alex (Sibling)', channel: 'SMS', value: '+1-555-0101' },
    { id: 2, name: 'Dr. Rivera (Therapist)', channel: 'Call', value: '+1-555-0123' },
];

function loadInitialPreferences() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.contacts)) return null;
        return parsed;
    } catch {
        return null;
    }
}

export default function SafetyEscalationConsole({ tier }) {
    const fromStorage = loadInitialPreferences();
    const [contacts, setContacts] = useState(fromStorage?.contacts || DEFAULT_CONTACTS);
    const [consentTrustedContact, setConsentTrustedContact] = useState(fromStorage?.consentTrustedContact ?? true);
    const [consentClinicalEscalation, setConsentClinicalEscalation] = useState(fromStorage?.consentClinicalEscalation ?? false);
    const [newContact, setNewContact] = useState({ name: '', channel: 'SMS', value: '' });
    const [lastEscalation, setLastEscalation] = useState(fromStorage?.lastEscalation || null);

    const canEscalateToContacts = useMemo(
        () => consentTrustedContact && contacts.length > 0 && tier >= 1,
        [consentTrustedContact, contacts.length, tier]
    );

    const persist = (next) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    };

    const saveAll = (nextContacts, nextTrusted, nextClinical, nextLastEscalation) => {
        persist({
            contacts: nextContacts,
            consentTrustedContact: nextTrusted,
            consentClinicalEscalation: nextClinical,
            lastEscalation: nextLastEscalation,
        });
    };

    const addContact = (e) => {
        e.preventDefault();
        const name = newContact.name.trim();
        const value = newContact.value.trim();
        if (!name || !value) return;

        const updated = [
            ...contacts,
            {
                id: Date.now(),
                name,
                channel: newContact.channel,
                value,
            },
        ];
        setContacts(updated);
        saveAll(updated, consentTrustedContact, consentClinicalEscalation, lastEscalation);
        setNewContact({ name: '', channel: 'SMS', value: '' });
    };

    const removeContact = (id) => {
        const updated = contacts.filter((c) => c.id !== id);
        setContacts(updated);
        saveAll(updated, consentTrustedContact, consentClinicalEscalation, lastEscalation);
    };

    const triggerEscalation = () => {
        const payload = {
            timestamp: new Date().toISOString(),
            tier,
            routedToContacts: canEscalateToContacts ? contacts.map((c) => `${c.name} via ${c.channel}`) : [],
            routedToClinical: consentClinicalEscalation && tier >= 2,
        };
        setLastEscalation(payload);
        saveAll(contacts, consentTrustedContact, consentClinicalEscalation, payload);
    };

    const onToggleTrusted = () => {
        const next = !consentTrustedContact;
        setConsentTrustedContact(next);
        saveAll(contacts, next, consentClinicalEscalation, lastEscalation);
    };

    const onToggleClinical = () => {
        const next = !consentClinicalEscalation;
        setConsentClinicalEscalation(next);
        saveAll(contacts, consentTrustedContact, next, lastEscalation);
    };

    return (
        <section className="card" style={{ marginTop: '16px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Escalation Preferences</h3>
            <p style={{ marginTop: 0, color: 'var(--color-text-muted)', fontSize: '14px' }}>
                Configure trusted contacts and explicit consent paths. Preferences are stored locally on this device for the demo.
            </p>

            <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px' }}>
                    <input type="checkbox" checked={consentTrustedContact} onChange={onToggleTrusted} />
                    Allow trusted-contact alerts for moderate/critical tiers
                </label>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px' }}>
                    <input type="checkbox" checked={consentClinicalEscalation} onChange={onToggleClinical} />
                    Allow clinician/social-service escalation for critical tier
                </label>
            </div>

            <div style={{ marginBottom: '12px', fontWeight: 600 }}>Trusted Contacts</div>
            <div style={{ display: 'grid', gap: '8px', marginBottom: '14px' }}>
                {contacts.map((contact) => (
                    <div
                        key={contact.id}
                        style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: '10px',
                            padding: '10px',
                            background: 'var(--surface)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '8px',
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{contact.name}</div>
                            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                {contact.channel}: {contact.value}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => removeContact(contact.id)}
                            style={{
                                border: '1px solid color-mix(in srgb, var(--color-danger) 36%, var(--color-border))',
                                background: 'var(--color-danger-soft)',
                                color: 'var(--color-danger)',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                            }}
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>

            <form onSubmit={addContact} style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                <input
                    value={newContact.name}
                    onChange={(e) => setNewContact((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Contact name"
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--surface-strong)', color: 'var(--color-ink)' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px' }}>
                    <select
                        value={newContact.channel}
                        onChange={(e) => setNewContact((prev) => ({ ...prev, channel: e.target.value }))}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--surface-strong)', color: 'var(--color-ink)' }}
                    >
                        <option>SMS</option>
                        <option>Call</option>
                        <option>Email</option>
                    </select>
                    <input
                        value={newContact.value}
                        onChange={(e) => setNewContact((prev) => ({ ...prev, value: e.target.value }))}
                        placeholder="Phone or email"
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--surface-strong)', color: 'var(--color-ink)' }}
                    />
                </div>
                <button type="submit" className="btn-primary" style={{ width: 'fit-content', padding: '10px 14px', fontSize: '13px' }}>
                    Add Contact
                </button>
            </form>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <button type="button" onClick={triggerEscalation} className="btn-primary" style={{ padding: '10px 14px', fontSize: '13px' }}>
                    Simulate Escalation Dispatch
                </button>
                <p style={{ margin: '8px 0 0', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                    Routing preview: {canEscalateToContacts ? `${contacts.length} trusted contact(s)` : 'No trusted-contact dispatch'}.
                    {consentClinicalEscalation && tier >= 2 ? ' Clinical escalation enabled.' : ' Clinical escalation not triggered.'}
                </p>
                {lastEscalation && (
                    <p style={{ margin: '8px 0 0', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                        Last dispatch: {new Date(lastEscalation.timestamp).toLocaleString()}
                    </p>
                )}
            </div>
        </section>
    );
}

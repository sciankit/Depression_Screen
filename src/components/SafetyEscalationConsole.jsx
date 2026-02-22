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
            <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px' }}><span className="section-icon">⚙️</span>Escalation Preferences</h3>
            <p style={{ marginTop: 0, color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
                Configure trusted contacts and explicit consent paths. Preferences are stored locally on this device for the demo.
            </p>

            <div style={{ display: 'grid', gap: '10px', marginBottom: '18px' }}>
                <label className="demo-toggle-row">
                    <input type="checkbox" checked={consentTrustedContact} onChange={onToggleTrusted} />
                    Allow trusted-contact alerts for moderate/critical tiers
                </label>
                <label className="demo-toggle-row">
                    <input type="checkbox" checked={consentClinicalEscalation} onChange={onToggleClinical} />
                    Allow clinician/social-service escalation for critical tier
                </label>
            </div>

            <div style={{ marginBottom: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>👥</span> Trusted Contacts
            </div>
            <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                {contacts.map((contact) => (
                    <div
                        key={contact.id}
                        style={{
                            borderRadius: '18px',
                            padding: '14px',
                            background: 'var(--surface-strong)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '10px',
                            alignItems: 'center',
                            boxShadow: '0 2px 8px rgba(180, 140, 100, 0.04)',
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
                                border: 'none',
                                background: 'var(--color-danger-soft)',
                                color: 'var(--color-danger)',
                                borderRadius: '12px',
                                padding: '8px 14px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '13px',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            }}
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>

            <form onSubmit={addContact} style={{ display: 'grid', gap: '10px', marginBottom: '18px' }}>
                <input
                    value={newContact.name}
                    onChange={(e) => setNewContact((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Contact name"
                    style={{
                        padding: '12px 16px',
                        borderRadius: '14px',
                        border: 'none',
                        background: 'var(--surface-strong)',
                        color: 'var(--color-ink)',
                        boxShadow: '0 2px 8px rgba(180, 140, 100, 0.04)',
                    }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px' }}>
                    <select
                        value={newContact.channel}
                        onChange={(e) => setNewContact((prev) => ({ ...prev, channel: e.target.value }))}
                        style={{
                            padding: '12px 14px',
                            borderRadius: '14px',
                            border: 'none',
                            background: 'var(--surface-strong)',
                            color: 'var(--color-ink)',
                            boxShadow: '0 2px 8px rgba(180, 140, 100, 0.04)',
                        }}
                    >
                        <option>SMS</option>
                        <option>Call</option>
                        <option>Email</option>
                    </select>
                    <input
                        value={newContact.value}
                        onChange={(e) => setNewContact((prev) => ({ ...prev, value: e.target.value }))}
                        placeholder="Phone or email"
                        style={{
                            padding: '12px 16px',
                            borderRadius: '14px',
                            border: 'none',
                            background: 'var(--surface-strong)',
                            color: 'var(--color-ink)',
                            boxShadow: '0 2px 8px rgba(180, 140, 100, 0.04)',
                        }}
                    />
                </div>
                <button type="submit" className="btn-primary" style={{ width: 'fit-content', padding: '12px 18px', fontSize: '13px' }}>
                    Add Contact
                </button>
            </form>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
                <button type="button" onClick={triggerEscalation} className="btn-primary" style={{ padding: '12px 18px', fontSize: '13px' }}>
                    Simulate Escalation Dispatch
                </button>
                <p style={{ margin: '10px 0 0', color: 'var(--color-text-muted)', fontSize: '13px', lineHeight: 1.6 }}>
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

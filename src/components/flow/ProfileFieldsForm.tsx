type ProfileFieldsFormProps = {
  /** Prefill display values for the shell — collect-only, not persisted. */
  defaults?: {
    firstName?: string;
    lastName?: string;
    mobile?: string;
  };
};

export function ProfileFieldsForm({ defaults }: ProfileFieldsFormProps) {
  return (
    <>
      <div className="hb-field">
        <label htmlFor="hb-first-name">First name</label>
        <input
          id="hb-first-name"
          name="firstName"
          type="text"
          autoComplete="given-name"
          defaultValue={defaults?.firstName ?? ""}
          placeholder="First name"
        />
      </div>
      <div className="hb-field">
        <label htmlFor="hb-last-name">Last name</label>
        <input
          id="hb-last-name"
          name="lastName"
          type="text"
          autoComplete="family-name"
          defaultValue={defaults?.lastName ?? ""}
          placeholder="Last name"
        />
      </div>
      <div className="hb-field">
        <label htmlFor="hb-mobile">Mobile</label>
        <input
          id="hb-mobile"
          name="mobile"
          type="tel"
          autoComplete="tel"
          defaultValue={defaults?.mobile ?? ""}
          placeholder="+27 ·········"
        />
      </div>
      <div className="hb-field">
        <label htmlFor="hb-dob">Date of birth</label>
        <input
          id="hb-dob"
          name="dateOfBirth"
          type="text"
          inputMode="numeric"
          autoComplete="bday"
          placeholder="DD / MM / YYYY"
          aria-describedby="hb-age-collect-hint"
        />
      </div>
      <div className="hb-field">
        <label htmlFor="hb-id">ID number</label>
        <input
          id="hb-id"
          name="idNumber"
          type="text"
          autoComplete="off"
          placeholder="Masked · secure handling"
          aria-describedby="hb-age-collect-hint"
        />
      </div>
      <p id="hb-age-collect-hint" className="hb-caption">
        Identity fields are minimized and stored securely. Age verification
        method is OPEN — collect-only; no verification provider asserted.
      </p>
    </>
  );
}

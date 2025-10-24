/**
 * UserProfile Component
 *
 * Displays comprehensive user profile information by combining data from Asgardeo
 * and the backend user service. Preserves behavior and messages used in tests.
 */


import React from "react";
import Card from "./common/Card";
import { COLORS } from "../constants/styles";

type UserProfileProps = {
  workEmail: string;
  firstName: string;
  lastName: string;
  userThumbnail: string;
  location: string;
};

export default function UserProfile({ workEmail, firstName, lastName, userThumbnail, location }: UserProfileProps) {
  return (
    <Card
      style={{
        background: COLORS.background,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 420,
        margin: '0 auto',
        boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <img
          src={userThumbnail}
          alt="User Thumbnail"
          style={{
            borderRadius: '50%',
            border: `2px solid ${COLORS.border}`,
            marginBottom: 16,
            width: 96,
            height: 96,
            maxWidth: '30vw',
            maxHeight: '30vw',
            objectFit: 'cover',
          }}
        />
        <h2 style={{ margin: 0, color: COLORS.primary, fontSize: '1.5rem', textAlign: 'center', wordBreak: 'break-word' }}>{firstName} {lastName}</h2>
        <div style={{ color: COLORS.secondary, marginBottom: 12, fontSize: '1rem', textAlign: 'center' }}>{location}</div>
        <div style={{ color: COLORS.text, fontSize: 15, marginBottom: 6, wordBreak: 'break-all', textAlign: 'center' }}>
          <b>Email:</b> {workEmail}
        </div>
      </div>
    </Card>
  );
}

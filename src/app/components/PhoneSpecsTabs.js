"use client";

import { useState } from "react";

export default function PhoneSpecsTabs({ sections }) {

  const [activeTab, setActiveTab] = useState("basic");

  const tabs = [
    {
      id: "basic",
      label: "BASIC INFO",
    },
    {
      id: "parameters",
      label: "PARAMETERS",
    },
    {
      id: "others",
      label: "OTHERS",
    },
  ];

  const activeSections =
    sections?.[activeTab] || [];

  return (
    <div className="phone-spec-tabs">

      {/* =================================================
          TABS
      ================================================= */}

      <div className="phone-spec-tab-buttons">

        {tabs.map((tab) => (

          <button
            key={tab.id}
            type="button"
            className={
              activeTab === tab.id
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(tab.id)
            }
          >
            {tab.label}
          </button>

        ))}

      </div>


      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="phone-spec-tab-content">

        {activeSections.map(
          (section) => {

            const visibleItems =
              (section.items || []).filter(
                ([, value]) =>
                  value !== null &&
                  value !== undefined &&
                  value !== "" &&
                  value !== "—"
              );

            if (!visibleItems.length) {
              return null;
            }

            return (

              <div
                className="phone-spec-group"
                key={section.title}
              >

                <h3 className="phone-spec-group-title">
                  {section.title}
                </h3>


                <div className="phone-spec-table">

                  {visibleItems.map(
                    ([label, value]) => (

                      <div
                        className="phone-spec-row"
                        key={label}
                      >

                        <div className="phone-spec-label">
                          {label}
                        </div>

                        <div className="phone-spec-value">
                          {String(value)}
                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>

            );
          }
        )}

      </div>

    </div>
  );
}
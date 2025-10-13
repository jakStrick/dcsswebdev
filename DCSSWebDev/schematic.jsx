import React from "react";

export default function OptocouplerSchematic() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white">
      {" "}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          24V to 5V Optocoupler Switch Interface
        </h2>{" "}
        <p className="text-gray-600 mb-1">
          Single Channel Schematic (Replicate 8 times for all channels)
        </p>{" "}
      </div>
      ```
      {/* Schematic SVG */}
      <svg
        viewBox="0 0 800 400"
        className="w-full border-2 border-gray-300 rounded-lg bg-gray-50"
      >
        {/* 24V Input Side */}
        <text x="40" y="30" className="text-sm font-bold fill-blue-700">
          24V INPUT SIDE
        </text>

        {/* 24V+ terminal */}
        <circle cx="80" cy="100" r="5" fill="red" />
        <text x="50" y="95" className="text-xs font-semibold fill-red-600">
          24V+
        </text>

        {/* Input resistor R1 */}
        <line
          x1="80"
          y1="100"
          x2="150"
          y2="100"
          stroke="black"
          strokeWidth="2"
        />
        <rect
          x="150"
          y="85"
          width="60"
          height="30"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
        <line
          x1="155"
          y1="90"
          x2="205"
          y2="110"
          stroke="black"
          strokeWidth="1.5"
        />
        <line
          x1="155"
          y1="110"
          x2="205"
          y2="90"
          stroke="black"
          strokeWidth="1.5"
        />
        <text x="160" y="78" className="text-xs font-semibold">
          R1
        </text>
        <text x="150" y="135" className="text-xs">
          1.2kΩ
        </text>

        {/* Wire to optocoupler anode */}
        <line
          x1="210"
          y1="100"
          x2="280"
          y2="100"
          stroke="black"
          strokeWidth="2"
        />

        {/* Optocoupler symbol */}
        {/* LED side (input) */}
        <g>
          {/* Anode */}
          <line
            x1="280"
            y1="100"
            x2="310"
            y2="100"
            stroke="black"
            strokeWidth="2"
          />
          {/* LED triangle */}
          <polygon
            points="310,100 330,90 330,110"
            fill="none"
            stroke="black"
            strokeWidth="2"
          />
          {/* Cathode */}
          <line
            x1="330"
            y1="100"
            x2="360"
            y2="100"
            stroke="black"
            strokeWidth="2"
          />
          {/* LED arrows */}
          <line
            x1="315"
            y1="85"
            x2="325"
            y2="75"
            stroke="black"
            strokeWidth="1.5"
          />
          <polygon points="325,75 322,78 328,78" fill="black" />
          <line
            x1="325"
            y1="85"
            x2="335"
            y2="75"
            stroke="black"
            strokeWidth="1.5"
          />
          <polygon points="335,75 332,78 338,78" fill="black" />
        </g>

        {/* GND connection */}
        <line
          x1="360"
          y1="100"
          x2="360"
          y2="200"
          stroke="black"
          strokeWidth="2"
        />
        <circle cx="360" cy="200" r="5" fill="black" />
        <text x="340" y="220" className="text-xs font-semibold">
          GND
        </text>

        {/* Optocoupler package outline */}
        <rect
          x="270"
          y="70"
          width="110"
          height="180"
          fill="none"
          stroke="blue"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        <text x="290" y="260" className="text-xs font-semibold fill-blue-700">
          U1 (PC817)
        </text>

        {/* Phototransistor side (output) */}
        <g>
          {/* Collector */}
          <line
            x1="310"
            y1="170"
            x2="340"
            y2="170"
            stroke="black"
            strokeWidth="2"
          />
          {/* Transistor symbol */}
          <line
            x1="330"
            y1="155"
            x2="330"
            y2="185"
            stroke="black"
            strokeWidth="3"
          />
          <line
            x1="330"
            y1="170"
            x2="350"
            y2="150"
            stroke="black"
            strokeWidth="2"
          />
          <line
            x1="330"
            y1="170"
            x2="350"
            y2="190"
            stroke="black"
            strokeWidth="2"
          />
          <polygon points="345,185 350,190 350,180" fill="black" />
          {/* Emitter */}
          <line
            x1="350"
            y1="190"
            x2="350"
            y2="210"
            stroke="black"
            strokeWidth="2"
          />
          {/* Light arrows */}
          <line
            x1="315"
            y1="140"
            x2="325"
            y2="150"
            stroke="black"
            strokeWidth="1.5"
          />
          <polygon points="315,140 318,143 318,137" fill="black" />
          <line
            x1="325"
            y1="140"
            x2="335"
            y2="150"
            stroke="black"
            strokeWidth="1.5"
          />
          <polygon points="325,140 328,143 328,137" fill="black" />
        </g>

        {/* 5V Output Side */}
        <text x="440" y="30" className="text-sm font-bold fill-green-700">
          5V OUTPUT SIDE
        </text>

        {/* 5V+ connection */}
        <circle cx="500" cy="60" r="5" fill="green" />
        <text x="510" y="65" className="text-xs font-semibold fill-green-600">
          5V+
        </text>
        <line
          x1="500"
          y1="60"
          x2="500"
          y2="120"
          stroke="black"
          strokeWidth="2"
        />

        {/* Pull-up resistor R2 */}
        <rect
          x="485"
          y="120"
          width="30"
          height="60"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
        <line
          x1="490"
          y1="125"
          x2="510"
          y2="175"
          stroke="black"
          strokeWidth="1.5"
        />
        <line
          x1="490"
          y1="175"
          x2="510"
          y2="125"
          stroke="black"
          strokeWidth="1.5"
        />
        <text x="520" y="145" className="text-xs font-semibold">
          R2
        </text>
        <text x="520" y="160" className="text-xs">
          4.7kΩ
        </text>

        {/* Connection to collector */}
        <line
          x1="340"
          y1="170"
          x2="500"
          y2="170"
          stroke="black"
          strokeWidth="2"
        />
        <line
          x1="500"
          y1="170"
          x2="500"
          y2="180"
          stroke="black"
          strokeWidth="2"
        />

        {/* Output node */}
        <circle cx="500" cy="170" r="4" fill="black" />
        <line
          x1="500"
          y1="170"
          x2="580"
          y2="170"
          stroke="black"
          strokeWidth="2"
        />
        <circle cx="580" cy="170" r="5" fill="orange" />
        <text x="590" y="175" className="text-xs font-semibold fill-orange-600">
          5V OUT
        </text>

        {/* GND connection for emitter */}
        <line
          x1="350"
          y1="210"
          x2="350"
          y2="240"
          stroke="black"
          strokeWidth="2"
        />
        <line
          x1="350"
          y1="240"
          x2="500"
          y2="240"
          stroke="black"
          strokeWidth="2"
        />
        <circle cx="500" cy="240" r="5" fill="black" />
        <text x="480" y="260" className="text-xs font-semibold">
          GND
        </text>

        {/* Voltage labels */}
        <text x="100" y="90" className="text-xs fill-gray-600">
          Control
        </text>
        <text x="100" y="103" className="text-xs fill-gray-600">
          Signal
        </text>

        {/* Isolation barrier */}
        <line
          x1="400"
          y1="50"
          x2="400"
          y2="280"
          stroke="red"
          strokeWidth="2"
          strokeDasharray="10,5"
        />
        <text
          x="405"
          y="160"
          className="text-xs font-bold fill-red-600 transform rotate-90"
          style={{ transformOrigin: "405px 160px" }}
        >
          ISOLATION BARRIER
        </text>
      </svg>
      {/* Parts List */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Parts List (Per Channel)</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Ref
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Component
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Value/Part#
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">U1</td>
                <td className="border border-gray-300 px-4 py-2">
                  Optocoupler
                </td>
                <td className="border border-gray-300 px-4 py-2">PC817</td>
                <td className="border border-gray-300 px-4 py-2">
                  4-pin DIP optocoupler, CTR 50-600%
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">R1</td>
                <td className="border border-gray-300 px-4 py-2">Resistor</td>
                <td className="border border-gray-300 px-4 py-2">1.2kΩ 1/4W</td>
                <td className="border border-gray-300 px-4 py-2">
                  Input current limiting (~18mA @ 24V)
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">R2</td>
                <td className="border border-gray-300 px-4 py-2">Resistor</td>
                <td className="border border-gray-300 px-4 py-2">4.7kΩ 1/4W</td>
                <td className="border border-gray-300 px-4 py-2">
                  Pull-up resistor for 5V output
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-bold mb-4 mt-6">
          Complete System (8 Channels)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Component
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center">
                  Quantity
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">
                  PC817 Optocoupler
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  8
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  One per channel
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">
                  1.2kΩ 1/4W Resistor
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  8
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  Input side current limiting
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">
                  4.7kΩ 1/4W Resistor
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  8
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  Output pull-up (optional if driving logic)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* Operation Notes */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-bold mb-2">Operation</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <strong>24V ON:</strong> Current flows through LED → Phototransistor
            conducts → 5V OUT pulled LOW (~0V)
          </li>
          <li>
            <strong>24V OFF:</strong> No LED current → Phototransistor off → 5V
            OUT pulled HIGH (5V) by R2
          </li>
          <li>
            <strong>Isolation:</strong> 2.5kV typical between input and output
            sides
          </li>
          <li>
            <strong>Response time:</strong> ~4µs typical (adequate for most
            switching applications)
          </li>
        </ul>
      </div>
      {/* Design Notes */}
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-bold mb-2">Design Notes</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <strong>R1 calculation:</strong> (24V - 1.2V LED drop) / 1.2kΩ ≈
            18mA (safe for PC817)
          </li>
          <li>
            <strong>R2 value:</strong> Can be adjusted based on load. Lower =
            faster rise time, higher current
          </li>
          <li>
            <strong>Output type:</strong> Active-low (inverted logic). Add
            inverter if active-high needed
          </li>
          <li>
            <strong>Alternative IC:</strong> Can use TLP181, HCPL-2531, or
            similar optocouplers
          </li>
          <li>
            <strong>PCB layout:</strong> Keep 24V and 5V sections separated for
            isolation
          </li>
        </ul>
      </div>
    </div>
  );
}

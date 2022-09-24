//all settings in this file will require restarting the server to apply

//safeguards
export const max_width = 50000
export const max_height = 50000
export const min_mass = 1 //prevent cells having zero or negative mass

//performance settings

//7 = your arena tends to be 2x more packed than normal
//8 = your arena tends to have normal density
//9 = your arena tends to be 2x less packed than normal
export const base_physics_box_size = 8

//socket settings
export const MAX_PACKET_SIZE = 1048576
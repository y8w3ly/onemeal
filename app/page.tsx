"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChefHat, Pizza, Utensils, Users, Plus, Trash2, ArrowUp, Edit } from "lucide-react"
import Image from "next/image"

type Section = "cuisine" | "chawarma" | "pizza" | "serveurs"
type ShiftType = "Matin" | "Soir" | "Doublé" | ""

interface Employee {
  id: string
  name: string
  payRates: {
    morning: number
    evening: number
    double: number
  }
  shifts: {
    saturday: ShiftType
    sunday: ShiftType
    monday: ShiftType
    tuesday: ShiftType
    wednesday: ShiftType
    thursday: ShiftType
  }
  acomptes: {
    saturday: number
    sunday: number
    monday: number
    tuesday: number
    wednesday: number
    thursday: number
  }
  totalPay: number
}

interface SectionData {
  employees: Employee[]
}

export default function OneMealApp() {
  const [activeSection, setActiveSection] = useState<Section>("cuisine")

  const [sectionsData, setSectionsData] = useState<Record<Section, SectionData>>({
    cuisine: { employees: [] },
    chawarma: { employees: [] },
    pizza: { employees: [] },
    serveurs: { employees: [] },
  })

  const migrateEmployeeData = (employee: any): Employee => {
    // If employee already has the new structure, return as is
    if (employee.acomptes && typeof employee.acomptes === "object" && employee.payRates) {
      return employee as Employee
    }

    return {
      ...employee,
      payRates: employee.payRates || {
        morning: 50,
        evening: 50,
        double: 100,
      },
      acomptes: employee.acomptes || {
        saturday: 0,
        sunday: 0,
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
      },
      acompte: undefined,
    }
  }

  useEffect(() => {
    const savedData = localStorage.getItem("oneMealData")
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        const migratedData = Object.keys(parsedData).reduce(
          (acc, sectionKey) => {
            acc[sectionKey as Section] = {
              ...parsedData[sectionKey],
              employees: parsedData[sectionKey].employees.map(migrateEmployeeData),
            }
            return acc
          },
          {} as Record<Section, SectionData>,
        )

        setSectionsData(migratedData)
      } catch (error) {
        console.error("Error loading saved data:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("oneMealData", JSON.stringify(sectionsData))
  }, [sectionsData])

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [newEmployeeName, setNewEmployeeName] = useState("")
  const [tempPayRates, setTempPayRates] = useState<{ morning: number; evening: number }>({ morning: 0, evening: 0 })

  const sections = [
    { id: "cuisine" as Section, label: "Cuisine", icon: ChefHat },
    { id: "chawarma" as Section, label: "Chawarma", icon: Utensils },
    { id: "pizza" as Section, label: "Pizza", icon: Pizza },
    { id: "serveurs" as Section, label: "Serveurs", icon: Users },
  ]

  const weekdays = [
    { key: "saturday", label: "Sam" },
    { key: "sunday", label: "Dim" },
    { key: "monday", label: "Lun" },
    { key: "tuesday", label: "Mar" },
    { key: "wednesday", label: "Mer" },
    { key: "thursday", label: "Jeu" },
  ]

  const calculateTotalPay = (employee: Employee): number => {
    let total = 0
    let totalAcomptes = 0

    Object.entries(employee.shifts).forEach(([day, shift]) => {
      if (shift === "Matin") total += employee.payRates.morning
      else if (shift === "Soir") total += employee.payRates.evening
      else if (shift === "Doublé") total += employee.payRates.double

      totalAcomptes += employee.acomptes[day as keyof Employee["acomptes"]] || 0
    })

    return total - totalAcomptes
  }

  const addEmployee = () => {
    if (!newEmployeeName.trim()) return

    const newEmployee: Employee = {
      id: Date.now().toString(),
      name: newEmployeeName,
      payRates: {
        morning: tempPayRates.morning,
        evening: tempPayRates.evening,
        double: tempPayRates.morning + tempPayRates.evening,
      },
      shifts: {
        saturday: "",
        sunday: "",
        monday: "",
        tuesday: "",
        wednesday: "",
        thursday: "",
      },
      acomptes: {
        saturday: 0,
        sunday: 0,
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
      },
      totalPay: 0,
    }

    setSectionsData((prev) => ({
      ...prev,
      [activeSection]: {
        employees: [...prev[activeSection].employees, newEmployee],
      },
    }))

    setNewEmployeeName("")
    setTempPayRates({ morning: 0, evening: 0 })
    setIsAddDialogOpen(false)
  }

  const editEmployee = () => {
    if (!editingEmployee || !newEmployeeName.trim()) return

    setSectionsData((prev) => ({
      ...prev,
      [activeSection]: {
        employees: prev[activeSection].employees.map((emp) =>
          emp.id === editingEmployee.id
            ? {
                ...emp,
                name: newEmployeeName,
                payRates: {
                  morning: tempPayRates.morning,
                  evening: tempPayRates.evening,
                  double: tempPayRates.morning + tempPayRates.evening,
                },
                totalPay: calculateTotalPay({
                  ...emp,
                  payRates: {
                    morning: tempPayRates.morning,
                    evening: tempPayRates.evening,
                    double: tempPayRates.morning + tempPayRates.evening,
                  },
                }),
              }
            : emp,
        ),
      },
    }))

    setEditingEmployee(null)
    setNewEmployeeName("")
    setTempPayRates({ morning: 0, evening: 0 })
    setIsEditDialogOpen(false)
  }

  const deleteEmployee = (employeeId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet employé définitivement?")) {
      setSectionsData((prev) => ({
        ...prev,
        [activeSection]: {
          employees: prev[activeSection].employees.filter((emp) => emp.id !== employeeId),
        },
      }))
    }
  }

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee)
    setNewEmployeeName(employee.name)
    setTempPayRates({
      morning: employee.payRates.morning,
      evening: employee.payRates.evening,
    })
    setIsEditDialogOpen(true)
  }

  const updateShift = (employeeId: string, day: keyof Employee["shifts"], newShift: ShiftType) => {
    setSectionsData((prev) => ({
      ...prev,
      [activeSection]: {
        employees: prev[activeSection].employees.map((emp) =>
          emp.id === employeeId
            ? {
                ...emp,
                shifts: { ...emp.shifts, [day]: newShift },
                totalPay: calculateTotalPay({
                  ...emp,
                  shifts: { ...emp.shifts, [day]: newShift },
                }),
              }
            : emp,
        ),
      },
    }))
  }

  const updateDailyAcompte = (employeeId: string, day: keyof Employee["acomptes"], acompte: number) => {
    setSectionsData((prev) => ({
      ...prev,
      [activeSection]: {
        employees: prev[activeSection].employees.map((emp) =>
          emp.id === employeeId
            ? {
                ...emp,
                acomptes: { ...emp.acomptes, [day]: acompte },
                totalPay: calculateTotalPay({
                  ...emp,
                  acomptes: { ...emp.acomptes, [day]: acompte },
                }),
              }
            : emp,
        ),
      },
    }))
  }

  const clearAllShifts = () => {
    if (confirm("Êtes-vous sûr de vouloir vider toutes les cases?")) {
      setSectionsData((prev) => ({
        ...prev,
        [activeSection]: {
          employees: prev[activeSection].employees.map((emp) => ({
            ...emp,
            shifts: {
              saturday: "",
              sunday: "",
              monday: "",
              tuesday: "",
              wednesday: "",
              thursday: "",
            },
            acomptes: {
              saturday: 0,
              sunday: 0,
              monday: 0,
              tuesday: 0,
              wednesday: 0,
              thursday: 0,
            },
            totalPay: 0,
          })),
        },
      }))
    }
  }

  const incrementPayRate = (field: "morning" | "evening") => {
    setTempPayRates((prev) => ({
      ...prev,
      [field]: prev[field] + 100,
    }))
  }

  const incrementAcompte = (employeeId: string, day: keyof Employee["acomptes"]) => {
    setSectionsData((prev) => ({
      ...prev,
      [activeSection]: {
        employees: prev[activeSection].employees.map((emp) =>
          emp.id === employeeId
            ? {
                ...emp,
                acomptes: { ...emp.acomptes, [day]: emp.acomptes[day] + 100 },
                totalPay: calculateTotalPay({
                  ...emp,
                  acomptes: { ...emp.acomptes, [day]: emp.acomptes[day] + 100 },
                }),
              }
            : emp,
        ),
      },
    }))
  }

  const currentData = sectionsData[activeSection]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ... existing header code ... */}
      <header className="bg-primary text-primary-foreground shadow-xl border-b-4 border-secondary">
        <div className="p-4 sm:p-6 text-center">
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full p-2 shadow-lg">
              <Image
                src="/images/one-meal-logo.png"
                alt="One Meal Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">
                <span className="text-white">oNe</span>
                <span className="text-secondary"> meal.</span>
              </h1>
            </div>
          </div>
          <p className="text-primary-foreground/80 text-xs sm:text-sm font-medium tracking-wide">
            Système de Gestion des Employés
          </p>
        </div>
      </header>

      <main className="flex-1 p-3 sm:p-6 pb-24 bg-gradient-to-br from-background to-muted/30">
        <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm">
          <div className="p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                {(() => {
                  const currentSection = sections.find((s) => s.id === activeSection)
                  const Icon = currentSection?.icon || ChefHat
                  return (
                    <>
                      <div className="p-2 sm:p-3 bg-primary/10 rounded-xl">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-card-foreground">{currentSection?.label}</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground">Gestion des horaires et salaires</p>
                      </div>
                    </>
                  )
                })()}
              </div>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      className="flex-1 sm:flex-none bg-secondary hover:bg-secondary/90 shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                      onClick={() => {
                        setTempPayRates({ morning: 50, evening: 50 })
                      }}
                    >
                      <Plus size={16} className="mr-1 sm:mr-2" />
                      Ajouter
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md mx-4 sm:mx-0">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl font-bold text-card-foreground">
                        Ajouter{" "}
                        {activeSection === "cuisine"
                          ? "un cuisinier"
                          : activeSection === "chawarma"
                            ? "un chawarmiste"
                            : activeSection === "pizza"
                              ? "un pizzario"
                              : "un serveur"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="name" className="text-sm font-semibold">
                          Nom de l'employé
                        </Label>
                        <Input
                          id="name"
                          value={newEmployeeName}
                          onChange={(e) => setNewEmployeeName(e.target.value)}
                          placeholder="Entrez le nom"
                          className="mt-2 text-base"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="morning" className="text-sm font-semibold">
                            Paye Matin
                          </Label>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="relative flex-1">
                              <Input
                                id="morning"
                                type="number"
                                value={tempPayRates.morning}
                                onChange={(e) =>
                                  setTempPayRates((prev) => ({ ...prev, morning: Number(e.target.value) }))
                                }
                                className="pr-12 text-base"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                DZD
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => incrementPayRate("morning")}
                              className="px-3 py-2 h-10 bg-secondary/10 hover:bg-secondary/20 border-secondary/30"
                            >
                              <ArrowUp size={16} className="text-secondary" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="evening" className="text-sm font-semibold">
                            Paye Soir
                          </Label>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="relative flex-1">
                              <Input
                                id="evening"
                                type="number"
                                value={tempPayRates.evening}
                                onChange={(e) =>
                                  setTempPayRates((prev) => ({ ...prev, evening: Number(e.target.value) }))
                                }
                                className="pr-12 text-base"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                DZD
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => incrementPayRate("evening")}
                              className="px-3 py-2 h-10 bg-secondary/10 hover:bg-secondary/20 border-secondary/30"
                            >
                              <ArrowUp size={16} className="text-secondary" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm font-semibold text-muted-foreground mb-1">
                          Paye Doublé (calculé automatiquement)
                        </p>
                        <p className="text-lg font-bold text-secondary">
                          {tempPayRates.morning + tempPayRates.evening} DZD
                        </p>
                      </div>
                      <Button onClick={addEmployee} className="w-full bg-primary hover:bg-primary/90 text-base py-3">
                        Ajouter l'employé
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogContent className="sm:max-w-md mx-4 sm:mx-0">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl font-bold text-card-foreground">
                        Modifier l'employé
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="edit-name" className="text-sm font-semibold">
                          Nom de l'employé
                        </Label>
                        <Input
                          id="edit-name"
                          value={newEmployeeName}
                          onChange={(e) => setNewEmployeeName(e.target.value)}
                          placeholder="Entrez le nom"
                          className="mt-2 text-base"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit-morning" className="text-sm font-semibold">
                            Paye Matin
                          </Label>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="relative flex-1">
                              <Input
                                id="edit-morning"
                                type="number"
                                value={tempPayRates.morning}
                                onChange={(e) =>
                                  setTempPayRates((prev) => ({ ...prev, morning: Number(e.target.value) }))
                                }
                                className="pr-12 text-base"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                DZD
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => incrementPayRate("morning")}
                              className="px-3 py-2 h-10 bg-secondary/10 hover:bg-secondary/20 border-secondary/30"
                            >
                              <ArrowUp size={16} className="text-secondary" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="edit-evening" className="text-sm font-semibold">
                            Paye Soir
                          </Label>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="relative flex-1">
                              <Input
                                id="edit-evening"
                                type="number"
                                value={tempPayRates.evening}
                                onChange={(e) =>
                                  setTempPayRates((prev) => ({ ...prev, evening: Number(e.target.value) }))
                                }
                                className="pr-12 text-base"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                DZD
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => incrementPayRate("evening")}
                              className="px-3 py-2 h-10 bg-secondary/10 hover:bg-secondary/20 border-secondary/30"
                            >
                              <ArrowUp size={16} className="text-secondary" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm font-semibold text-muted-foreground mb-1">
                          Paye Doublé (calculé automatiquement)
                        </p>
                        <p className="text-lg font-bold text-secondary">
                          {tempPayRates.morning + tempPayRates.evening} DZD
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={editEmployee} className="flex-1 bg-primary hover:bg-primary/90 text-base py-3">
                          Sauvegarder
                        </Button>
                        <Button
                          onClick={() => editingEmployee && deleteEmployee(editingEmployee.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-3"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  size="lg"
                  className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:bg-gray-300 disabled:text-gray-500 text-sm sm:text-base"
                  onClick={clearAllShifts}
                  disabled={currentData.employees.length === 0}
                >
                  <Trash2 size={16} className="mr-1 sm:mr-2" />
                  Vider
                </Button>
              </div>
            </div>

            {currentData.employees.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <p className="text-base sm:text-lg font-medium mb-2">Aucun employé ajouté</p>
                <p className="text-sm">Cliquez sur "Ajouter" pour commencer la gestion des horaires</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full border-collapse bg-background min-w-[800px]">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 sm:p-4 font-semibold text-card-foreground border-b border-border sticky left-0 bg-muted/50 min-w-[140px]">
                        Employé
                      </th>
                      {weekdays.map((day) => (
                        <th
                          key={day.key}
                          className="text-center p-2 sm:p-4 font-semibold text-card-foreground border-b border-border min-w-[140px]"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-sm sm:text-base">{day.label}</span>
                            <span className="text-xs text-muted-foreground font-normal">Shift / Acompte</span>
                          </div>
                        </th>
                      ))}
                      <th className="text-center p-3 sm:p-4 font-semibold text-card-foreground border-b border-border min-w-[120px]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.employees.map((employee, index) => (
                      <tr
                        key={employee.id}
                        className={`hover:bg-muted/30 transition-colors ${index % 2 === 0 ? "bg-background" : "bg-muted/10"}`}
                      >
                        <td className="p-3 sm:p-4 font-semibold text-card-foreground border-b border-border/50 sticky left-0 bg-inherit">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm sm:text-base">{employee.name}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(employee)}
                              className="p-1 h-8 w-8 hover:bg-muted/50"
                            >
                              <Edit size={14} className="text-muted-foreground hover:text-primary" />
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            M: {employee.payRates.morning} | S: {employee.payRates.evening} | D:{" "}
                            {employee.payRates.double} DZD
                          </div>
                        </td>
                        {weekdays.map((day) => (
                          <td key={day.key} className="p-2 border-b border-border/50">
                            <div className="flex flex-col gap-2">
                              <Select
                                value={employee.shifts[day.key as keyof Employee["shifts"]] || "N/A"}
                                onValueChange={(value) =>
                                  updateShift(employee.id, day.key as keyof Employee["shifts"], value as ShiftType)
                                }
                              >
                                <SelectTrigger className="w-full h-9 text-xs sm:text-sm">
                                  <SelectValue placeholder="-" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="N/A">-</SelectItem>
                                  <SelectItem value="Matin">Matin</SelectItem>
                                  <SelectItem value="Soir">Soir</SelectItem>
                                  <SelectItem value="Doublé">Doublé</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex items-center gap-1">
                                <div className="relative flex-1">
                                  <Input
                                    type="number"
                                    value={employee.acomptes[day.key as keyof Employee["acomptes"]]}
                                    onChange={(e) =>
                                      updateDailyAcompte(
                                        employee.id,
                                        day.key as keyof Employee["acomptes"],
                                        Number(e.target.value),
                                      )
                                    }
                                    className="w-full h-9 text-xs pr-8"
                                    placeholder="0"
                                  />
                                  <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                    DZD
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => incrementAcompte(employee.id, day.key as keyof Employee["acomptes"])}
                                  className="px-2 py-1 h-9 w-9 bg-secondary/10 hover:bg-secondary/20 border-secondary/30"
                                >
                                  <ArrowUp size={12} className="text-secondary" />
                                </Button>
                              </div>
                            </div>
                          </td>
                        ))}
                        <td className="p-3 sm:p-4 text-center border-b border-border/50">
                          <span className="font-bold text-sm sm:text-lg text-secondary bg-white border-2 border-secondary px-2 sm:px-3 py-1 rounded-full">
                            {calculateTotalPay(employee)} DZD
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </main>

      {/* ... existing navigation code ... */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border shadow-2xl">
        <div className="flex">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id

            return (
              <Button
                key={section.id}
                variant="ghost"
                className={`flex-1 flex flex-col items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-3 rounded-none h-auto transition-all duration-200 min-h-[60px] sm:min-h-[70px] ${
                  isActive
                    ? "text-primary bg-white hover:bg-gray-50 border-t-2 border-primary shadow-sm"
                    : "text-muted-foreground hover:text-card-foreground hover:bg-muted/30"
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                <Icon size={20} className={`sm:w-6 sm:h-6 ${isActive ? "text-primary" : ""}`} />
                <span className={`text-xs font-semibold ${isActive ? "text-primary" : ""}`}>{section.label}</span>
              </Button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

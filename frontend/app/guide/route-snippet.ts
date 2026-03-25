// Add this route to your backend/src/routes/api.ts
// Paste it just before the line: export default router

router.post("/guide/ask", async (req: Request, res: Response) => {
  const { question, phone } = req.body
  const worker = await prisma.worker.findUnique({ where: { phone } })

  // Use a default worker context if phone not found
  const workerContext = worker || {
    name: "Freelancer",
    skill: "general",
    location: "Kenya",
    score: 4.0,
    totalJobs: 0,
    phone: phone,
    id: "",
    verified: false,
    idNumber: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const { getGuideAdvice } = await import("../services/guide")
  const advice = await getGuideAdvice(workerContext as any, question)

  await logActivity("guide", "guide", `Web Guide query: ${question.substring(0, 50)}`, phone)

  res.json({ advice })
})
